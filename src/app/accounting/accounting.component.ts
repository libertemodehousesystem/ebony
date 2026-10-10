import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  effect,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { forkJoin, lastValueFrom, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import JsBarcode from 'jsbarcode';

import { environment } from '../../environments/environment';

import { AuthaccessService } from '../services/authaccess.service';
import { StoreaccessService, Customer, emptyCustomer } from '../services/storeaccess.service';
import { FunctionaccessService } from '../services/functionaccess.service';
import { SquareAccountService } from '../services/square-account.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CustomerinfoComponent } from '../commons/customerinfo/customerinfo.component';

declare function StarWebPrintTrader(options): void;
declare function StarWebPrintBuilder(): void;

@Component({
  imports: [FormsModule, NgClass, CustomerinfoComponent],
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.scss'],
})
export class AccountingComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private activatedroute = inject(ActivatedRoute);
  private auaService = inject(AuthaccessService);
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);
  private squareAccountService = inject(SquareAccountService);

  cansearch = false;

  readonly customerinfo = signal<Customer>(emptyCustomer());

  cartplates;
  items;
  cartitems;
  readonly measurement = signal<any>({
    matashita: 0,
    skirttake: 0,
    ext01_name: '',
    ext01_length: 0,
    ext02_name: '',
    ext02_length: 0,
    includepostage: true,
    includepostage2: true,
  });

  postageitem;

  readonly checkout = signal<any>({
    customer_uid: null,
    items: [],
    postage_money: 0,
    postage2_money: 0,
    total_tax_money: 0,
    total_money: 0,
    square_order_id: null,
    square_payment_id: null,
    payment_method: null,
    receive_money: 0,
    change_money: 0,
    earned_at: null,
  });

  readonly checkmethod = signal('');

  readonly canvasPaper = viewChild<ElementRef>('CanvasPaper');
  cvscontext: CanvasRenderingContext2D;
  readonly canvasheight = signal(600);

  printerurl = '';

  banks = [];

  readonly visiblectrl = signal({
    canregist: false,
    other: false,
    cash: false,
    input: false,
    result: false,
  });

  readonly splashdisplay = signal(false);
  readonly splashmsg = signal('データを登録しています…');

  readonly dialogdisplay = signal(false);
  readonly dialogmsg = signal('');

  readonly canrefund = signal(false);

  private customerstatsubscription: Subscription;

  readonly targetcheckcomment = signal<any>(null);

  kainumber = 'T7020001069051';
  readonly canissue = signal(false);

  // リストの更新に合わせてバーコードを生成する
  readonly accountingitems = viewChildren('AccountingItems');
  private readonly barcodeEffect = effect(() => {
    this.accountingitems();
    untracked(() => this.renderbarcodes());
  });


  postages = this.staService.postages;
  readonly incpostage = signal(false);
  readonly incpostage2 = signal(false);

  private patchcheckout(patch: object) {
    this.checkout.update((checkout) => ({ ...checkout, ...patch }));
  }

  private patchvisible(patch: object) {
    this.visiblectrl.update((visiblectrl) => ({ ...visiblectrl, ...patch }));
  }

  ngOnInit(): void {
    const tailoruser = this.auaService.tailoruser;
    if (!tailoruser || !(tailoruser.role == 'super' || tailoruser.role == 'operator')) {
      this.router.navigate(['']);
      return;
    }
    this.cansearch = tailoruser.role == 'super';

    this.staService.getbanks().subscribe({
      next: (resbanks) => {
        this.banks = resbanks;
      },
    });

    this.customerstatsubscription = this.staService.customerState.subscribe({
      next: (customer) => {
        this.customerinfo.set(customer);
        // クリア
        this.patchcheckout({
          postage_money: 0,
          postage2_money: 0,
          total_tax_money: 0,
          total_money: 0,
          receive_money: 0,
          change_money: 0,
        });
        forkJoin([
          this.staService.getcartplates(),
          this.staService.getitems(),
          this.staService.getcartitems(customer.customer_uid),
          this.staService.getcartorder(customer.customer_uid),
          this.staService.getcartmeasurement(customer.customer_uid),
          this.staService.getcheckcomment(customer.customer_uid),
        ]).subscribe({
          next: (results) => {
            this.cartplates = results[0];
            this.cartplates.push({
              plate_id: null,
              caption: 'その他',
              ordinal: 100,
              genders: [1, 2],
              cartitems: [],
            });
            this.items = results[1];
            this.cartitems = results[2];
            this.cartitems.sort((a, b) => {
              if (a.item_id > b.item_id) return 1;
              if (a.item_id < b.item_id) return -1;
              return 0;
            });
            const order = results[3];
            this.patchcheckout({
              square_order_id: order.square_order_id,
              square_payment_id: order.square_payment_id,
              payment_method: order.payment_method,
              receive_money: Number(order.receive_money),
              change_money: Number(order.change_money),
              earned_at: order.earned_at,
            });

            this.measurement.set(results[4]);
            this.targetcheckcomment.set(results[5]);

            if (customer.customer_uid) {
              this.generatecheckouts().then(() => {
                // checkoutsを作成したら更新する
                return this.staService.setcartmeasurement(customer.customer_uid, this.measurement());
              }).catch((error) => {
                commonlib.errorlog(error);
              });
              const checkout = this.checkout();
              if (checkout.square_order_id) {
                this.patchvisible({
                  canregist: false,
                  other: false,
                  cash: checkout.payment_method == 'CASH',
                  input: false,
                  result: checkout.payment_method == 'CASH',
                });
              } else {
                this.checkmethod.set('');
                this.patchvisible({ canregist: true, other: false, cash: false, input: false, result: false });
              }
              // レシート発行用の高さ変更
              if (checkout.payment_method) {
                this.canvasheight.set(this.adjustcanvasheight(checkout.payment_method));
              }
              // レシート発行可否
              this.canissue.set(checkout.payment_method == 'CASH');
            } else {
              this.patchvisible({ canregist: false, other: false, cash: false, input: false, result: false });
            }
          },
          error: (error) => {
            commonlib.errorlog(error);
          },
        });
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });

    //送料アイテム
    this.getpostageitem().subscribe({
      error: (error) => {
        commonlib.errorlog(error);
      },
    });

    //プリンター設定
    this.getprinterurl().subscribe({
      next: (addr) => {
        this.printerurl = `${environment.printprotocol}${addr ? addr : 'localhost'}/StarWebPRNT/SendMessage`;
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });

    this.activatedroute.paramMap.subscribe({
      next: (routeparams) => {
        const rev_customer_uid = routeparams.get('customer_uid');
        if (rev_customer_uid) {
          this.staService.gettailorcustomer(rev_customer_uid).subscribe({
            next: (res_customer) => {
              this.customerinfo.set(res_customer);
              this.staService.sendcustomerchange(res_customer);
            },
          });
        }
      },
    });
  }

  ngAfterViewInit(): void {
    // canvasの領域作成
    this.cvscontext = this.canvasPaper().nativeElement.getContext('2d');
  }

  private renderbarcodes() {
    const items = this.checkout().items;
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].skus.length; j++) {
        JsBarcode(`#barcode${i}-${j}`, items[i].skus[j], {
          width: 1,
          height: 30,
          displayValue: false,
        });
      }
    }
  }

  ngOnDestroy(): void {
    if (this.customerstatsubscription) {
      this.customerstatsubscription.unsubscribe();
    }
  }

  // レシート高さの調整関数
  adjustcanvasheight(method) {
    //   1455 + this.checkout().items.length * 56 :
    //   1220 + this.checkout().items.length * 56 :
    return method == 'CASH'
      ? 1248 + this.checkout().items.length * 56
      : 1342 + this.checkout().items.length * 56 + this.banks.length * 70 + 28;
  }

  adjustreceiptheight() {
    return 1623 + this.checkout().items.length * 56;
  }

  getpostageitem() {
    return this.staService.getpostageitem().pipe(
      map((respostageitem) => {
        this.postageitem = respostageitem;
      }),
    );
  }

  getprinterurl() {
    return this.staService.getprintersetting().pipe(
      map((setting) => {
        return setting.printer_addr;
      }),
    );
  }

  regeneratecheckouts() {
    Promise.resolve()
      .then(() => {
        this.patchcheckout({ postage_money: 0, postage2_money: 0, total_tax_money: 0, total_money: 0 });
        return this.generatecheckouts();
      })
      .then(() => {
        return this.staService.setcartmeasurement(this.customerinfo().customer_uid, this.measurement());
      })
      .then(() => {
        //
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  async generatecheckouts() {
    const items: any[] = [];
    const lineitems = [];
    let incpostage = false;
    let incpostage2 = false;
    for (const cartplate of this.cartplates) {
      const filteredcartitem = this.cartitems.filter((v) => v.plate_id == cartplate.plate_id);
      for (const cartitem of filteredcartitem) {
        const item = this.items.find((v) => v.item_id == cartitem.item_id);
        const postgae = this.postages.find((v) => v.postage_id == item.postage_id);
        const variation = item.variations.find((v) => v.variation_id == cartitem.variation.variation_id);
        variation.matashita = cartitem.variation.matashita;
        lineitems.push({
          quantity: String(cartitem.amount),
          catalog_object_id: variation.variation_id,
          applied_taxes: [{ tax_uid: 'consumption_tax' }],
        });
        items.push({
          cartitem_id: cartitem.cartitem_id,
          customer_uid: cartitem.customer_uid,
          item_id: cartitem.item_id,
          item_name: item ? item.item_name : null,
          plate_id: cartitem.plate_id,
          amount: cartitem.amount,
          postage: postgae,
          variation: variation ? variation : null,
          skus: Array(cartitem.amount).fill(variation.sku),
          base_price_money: 0,
          tax_money: 0,
          money: 0,
          pickupitem: item ? (item.pickupitem ? item.pickupitem : false) : false,
        });
        if (item.postage_id == 1) {
          incpostage = true;
        } else if (item.postage_id == 2) {
          incpostage2 = true;
        }
      }
    }
    this.incpostage.set(incpostage);
    this.incpostage2.set(incpostage2);
    const measurement = this.measurement();
    if (measurement.includepostage == null) {
      measurement.includepostage = incpostage;
    }
    if (measurement.includepostage2 == null) {
      measurement.includepostage2 = incpostage2;
    }
    // 冬物・夏物送料の追加
    const postageline = {
      quantity: '1',
      catalog_object_id: this.postageitem?.variation_id,
      applied_taxes: [{ tax_uid: 'consumption_tax' }],
    };
    if (this.postageitem && measurement.includepostage) {
      lineitems.push({ ...postageline });
    }
    if (this.postageitem && measurement.includepostage2) {
      lineitems.push({ ...postageline });
    }
    const calcorder = await this.calcorder(lineitems);
    const line_items = calcorder.line_items.filter((v) => v.catalog_object_id != this.postageitem.variation_id);
    for (const line_item of line_items) {
      const item = items.find((v) => v.variation.variation_id == line_item.catalog_object_id);
      item.base_price_money = line_item.base_price_money.amount ? line_item.base_price_money.amount : 0;
      item.tax_money = line_item.total_tax_money.amount;
      item.money = line_item.total_money.amount;
    }
    const postage = calcorder.line_items.find((v) => v.catalog_object_id == this.postageitem.variation_id);
    this.measurement.update((m) => ({ ...m }));
    this.patchcheckout({
      items: items,
      customer_uid: this.customerinfo().customer_uid,
      postage_money: postage && measurement.includepostage ? postage.total_money.amount : 0,
      postage2_money: postage && measurement.includepostage2 ? postage.total_money.amount : 0,
      total_tax_money: calcorder.total_tax_money.amount,
      total_money: calcorder.total_money.amount,
    });
  }

  async calcorder(lineitems) {
    console.log('calc');
    const office = this.staService.office;
    console.log('lineitems:', lineitems);
    return await Promise.resolve()
      .then(() => {
        const req = {
          customer_uid: this.customerinfo().customer_uid,
          lineitems: lineitems,
          office: office,
        };
        console.log('req:', req);
        return this.fnaService.calcorder(req.customer_uid, req.lineitems, req.office);
      })
      .then((calcresult) => {
        console.log('calresult:', calcresult);
        return calcresult.order;
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  convertcurrency(value) {
    return commonlib.currencyJP(value);
  }

  changecheckmethod(method) {
    this.checkmethod.set(method);
    // canvasの高さ変更
    this.canvasheight.set(this.adjustcanvasheight(method));
    console.log('canvasheight:', this.canvasheight());
    if (method == 'CASH') {
      this.patchvisible({ other: false });
      this.patchvisible({ cash: true });
      this.patchvisible({ input: true });
      this.patchvisible({ result: true });
      this.canissue.set(true);
      // 受取金額にフォーカスを合わす
      setTimeout(() => {
        const element = document.getElementById('receivebox');
        if (element) {
          element.focus();
        }
      }, 300);
    } else {
      this.patchvisible({ other: true });
      this.patchvisible({ cash: false });
      this.patchvisible({ input: false });
      this.patchvisible({ result: false });
      this.canissue.set(false);
    }
  }

  furikomidetail() {
    this.splashmsg.set('データを登録しています…');
    this.splashdisplay.set(true);
    this.patchcheckout({ receive_money: 0 });
    this.patchcheckout({ change_money: 0 });
    this.patchcheckout({ earned_at: new Date().toISOString() });
    Promise.resolve()
      .then(() => {
        console.log('regist customer');
        return this.squareAccountService.registSquareCustomer(this.customerinfo());
      })
      .then(() => {
        console.log('regist orderandpayment');
        return this.registorderandpayment();
      })
      .then(() => {
        this.splashmsg.set('レシートを発行しています…');
        this.makepurchasestaement(28, 28, 384, 1);
        this.sendMessageCanvas(1);
        this.splashdisplay.set(false);
      })
      .catch((error) => {
        commonlib.errorlog(error);
        this.splashdisplay.set(false);
        this.dialogdisplay.set(true);
        this.dialogmsg.set('売上登録が出来ませんでした。');
      });
  }

  cashheckout() {
    const diff = this.checkout().receive_money - this.checkout().total_money;
    if (diff < 0) {
      console.log('minus');
      this.dialogdisplay.set(true);
      this.dialogmsg.set('お預かり金額がマイナスです。');
      return;
    }

    this.splashmsg.set('データを登録しています…');
    this.splashdisplay.set(true);
    this.patchcheckout({ earned_at: new Date().toISOString() });
    Promise.resolve()
      .then(() => {
        console.log('regist customer');
        return this.squareAccountService.registSquareCustomer(this.customerinfo());
      })
      .then(() => {
        console.log('regist orderandpayment');
        return this.registorderandpayment();
      })
      .then(() => {
        this.splashmsg.set('レシートを発行しています…');
        this.makepurchasestaement(28, 28, 384, 1);
        this.sendMessageCanvas(1);
        this.splashdisplay.set(false);
      })
      .catch((error) => {
        commonlib.errorlog(error);
        this.splashdisplay.set(false);
      });
  }

  removecheck() {
    this.patchcheckout({ receive_money: 0 });
    this.patchcheckout({ change_money: 0 });
  }

  backspacecheck() {
    let strreceive = String(this.checkout().receive_money);
    if (strreceive.length > 1) {
      this.patchcheckout({ receive_money: Number(strreceive.substring(0, strreceive.length - 1)) });
    } else {
      this.patchcheckout({ receive_money: 0 });
    }
    this.calcchange();
  }

  inputcheck(value) {
    if (this.checkout().receive_money == 0) {
      this.patchcheckout({ receive_money: Number(value) });
    } else {
      this.patchcheckout({ receive_money: this.checkout().receive_money * 10 + Number(value) });
    }
    this.calcchange();
  }

  inputzero() {
    if (this.checkout().receive_money == 0) {
      this.patchcheckout({ receive_money: 0 });
    } else {
      this.patchcheckout({ receive_money: this.checkout().receive_money * 10 });
    }
    this.calcchange();
  }

  inputzerozero() {
    if (this.checkout().receive_money == 0) {
      this.patchcheckout({ receive_money: 0 });
    } else {
      this.patchcheckout({ receive_money: this.checkout().receive_money * 100 });
    }
    this.calcchange();
  }

  calcchange() {
    // お釣りの計算
    const diff = this.checkout().receive_money - this.checkout().total_money;
    if (diff > 0) {
      this.patchcheckout({ change_money: diff });
    } else {
      this.patchcheckout({ change_money: 0 });
    }
  }

  // 購入明細発行
  makepurchasestaement(fontSize, lineSpace, receiptWidth, logoScale) {
    if (this.cvscontext) {
      const canvasPaper = this.canvasPaper();
      this.cvscontext.clearRect(
        0,
        0,
        canvasPaper.nativeElement.width,
        canvasPaper.nativeElement.height,
      );
      this.cvscontext.textBaseline = 'top';

      let font = '';

      font += fontSize + 'px ';

      font += 'monospace';
      this.cvscontext.font = font;

      const leftPosition = 0;
      const centerPosition = (canvasPaper.nativeElement.width - 16) / 2;
      const rightPosition = canvasPaper.nativeElement.width - 16;

      let cursor = 0;

      let logoimage = document.getElementById('logo') as HTMLImageElement;
      this.cvscontext.drawImage(
        logoimage,
        centerPosition - logoimage.width / 2,
        cursor,
        logoimage.width,
        logoimage.height,
      );
      cursor += 246;
      this.drawLeftText('神奈川県川崎市中原区小杉町', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('3-4-3 メゾンプレール 1F', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('TEL 044-722-2901', leftPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;
      this.drawLeftText(`登録番号：${this.kainumber}`, leftPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;

      const chumonID = this.checkout().square_order_id
        ? this.checkout().square_order_id
        : 'XXXXXXXXXXXXXXX';
      this.drawLeftText(`注文ID:${chumonID.substring(0, 15)}`, leftPosition, cursor);
      cursor += lineSpace;

      console.log('earned_at:', this.checkout().earned_at);
      const earneddate = new Date(this.checkout().earned_at);
      const week = ['日', '月', '火', '水', '木', '金', '土'][earneddate.getDay()];
      earneddate.setHours(earneddate.getHours() + 9);
      this.drawLeftText(
        commonlib.convertJPfullww(earneddate.toISOString(), week),
        leftPosition,
        cursor,
      );
      cursor += lineSpace;

      cursor += lineSpace;

      this.drawCenterText('購入明細', centerPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;
      this.drawRightText(
        `${this.customerinfo().customer_family_name} ${this.customerinfo().customer_given_name} 様`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;
      this.cvscontext.fillRect(0, cursor - 2, receiptWidth, 2); // Underline

      cursor += lineSpace;

      this.drawLeftText('お買い上げありがとうござい', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('ます。', leftPosition, cursor);
      cursor += lineSpace;

      cursor += lineSpace;

      for (const i in this.checkout().items) {
        this.drawLeftText(
          `${this.checkout().items[i].item_name} ${this.checkout().items[i].variation.variation_name}`,
          leftPosition,
          cursor,
        );
        cursor += lineSpace;
        this.drawRightText(
          `${this.checkout().items[i].amount}ヶ ${this.convertcurrency(this.checkout().items[i].money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }

      cursor += lineSpace;

      this.cvscontext.fillRect(0, cursor - 2, receiptWidth, 2); // Underline
      if (this.checkout().postage_money > 0) {
        this.drawLeftText('冬物送料（税込）', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().postage_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }
      if (this.checkout().postage2_money > 0) {
        this.drawLeftText('夏物送料（税込）', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().postage2_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }
      this.drawLeftText('内消費税（10%）', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().total_tax_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;
      this.drawLeftText('合計', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().total_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;

      cursor += lineSpace;

      if (this.checkmethod() == 'CASH') {
        this.drawLeftText('お預かり', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().receive_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
        this.drawLeftText('お釣り', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().change_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      } else {
        this.drawLeftText('***************************', leftPosition, cursor);
        cursor += lineSpace;
        this.drawLeftText('振込先', leftPosition, cursor);
        cursor += lineSpace;

        for (const i in this.banks) {
          const bank = this.banks[i];
          cursor += lineSpace / 2;
          const koza_kind = bank.bank_kind == 'NORMAL' ? '普通口座' : '当座口座';
          this.drawLeftText(`${bank.bank_name} ${bank.shiten_name}`, leftPosition, cursor);
          cursor += lineSpace;
          this.drawLeftText(`${koza_kind} ${bank.bank_koza}`, leftPosition, cursor);
          cursor += lineSpace;
        }

        cursor += lineSpace;

        this.drawLeftText('10日以内にお子様のお名前', leftPosition, cursor);
        cursor += lineSpace;
        this.drawLeftText('でお振込みください。', leftPosition, cursor);
        cursor += lineSpace;
        this.drawLeftText('***************************', leftPosition, cursor);
        cursor += lineSpace;
      }

      cursor += lineSpace;

      this.drawLeftText('身近なテーラー「仕立館」', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('(株)大久保洋服店', leftPosition, cursor);
      cursor += lineSpace;

      let image = document.getElementById('hoseiecqr') as HTMLImageElement;
      this.cvscontext.drawImage(image, 0, cursor, image.width, image.height);
    }
  }

  // レシート（領収書）発行
  makereceipt(fontSize, lineSpace, receiptWidth, logoScale, issue_no) {
    if (this.cvscontext) {
      const canvasPaper = this.canvasPaper();
      this.cvscontext.clearRect(
        0,
        0,
        canvasPaper.nativeElement.width,
        canvasPaper.nativeElement.height,
      );
      this.cvscontext.textBaseline = 'top';

      let font = '';

      font += fontSize + 'px ';

      font += 'monospace';
      this.cvscontext.font = font;

      const leftPosition = 0;
      const centerPosition = (canvasPaper.nativeElement.width - 16) / 2;
      const rightPosition = canvasPaper.nativeElement.width - 16;

      let cursor = 0;

      let logoimage = document.getElementById('logo') as HTMLImageElement;
      this.cvscontext.drawImage(
        logoimage,
        centerPosition - logoimage.width / 2,
        cursor,
        logoimage.width,
        logoimage.height,
      );
      cursor += 246;
      this.drawLeftText('神奈川県川崎市中原区小杉町', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('3-4-3 メゾンプレール 1F', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('TEL 044-722-2901', leftPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;
      this.drawLeftText(`登録番号：${this.kainumber}`, leftPosition, cursor);
      cursor += lineSpace;
      if (issue_no > 1) {
        this.drawLeftText(`再発行[${commonlib.zeroPadding(issue_no, 3)}]`, leftPosition, cursor);
        cursor += lineSpace;
      } else {
        cursor += lineSpace;
      }
      const nowdate = new Date();
      this.drawLeftText(
        `発行日:${commonlib.convertJP(nowdate.toISOString().substring(0, 10))}`,
        leftPosition,
        cursor,
      );
      cursor += lineSpace;
      cursor += lineSpace;

      const chumonID = this.checkout().square_order_id
        ? this.checkout().square_order_id
        : 'xxxxxxxxxxxxxxx';
      this.drawLeftText(`注文ID:${chumonID.substring(0, 15)}`, leftPosition, cursor);
      cursor += lineSpace;

      const earneddate = new Date(this.checkout().earned_at);
      const week = ['日', '月', '火', '水', '木', '金', '土'][earneddate.getDay()];
      earneddate.setHours(earneddate.getHours() + 9);
      this.drawLeftText(
        commonlib.convertJPfullww(earneddate.toISOString(), week),
        leftPosition,
        cursor,
      );
      cursor += lineSpace;
      cursor += lineSpace;

      this.drawCenterText('領収証', centerPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;
      this.drawRightText('様', rightPosition, cursor);
      cursor += lineSpace;
      this.cvscontext.fillRect(0, cursor - 2, receiptWidth, 2); // Underline
      cursor += lineSpace;
      this.drawLeftText('但し、制服代として', leftPosition, cursor);
      cursor += lineSpace;
      cursor += lineSpace;
      let stampimage = document.getElementById('stamp') as HTMLImageElement;
      this.cvscontext.drawImage(
        stampimage,
        rightPosition - stampimage.width,
        cursor,
        stampimage.width,
        stampimage.height,
      );
      cursor += lineSpace * 7;

      cursor += lineSpace;

      this.drawCenterText(
        `${this.customerinfo().customer_family_name} ${this.customerinfo().customer_given_name} 様`,
        centerPosition,
        cursor,
      );
      cursor += lineSpace;

      cursor += lineSpace;

      this.drawLeftText('お買い上げありがとうござい', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('ます。', leftPosition, cursor);
      cursor += lineSpace;

      cursor += lineSpace;

      for (const i in this.checkout().items) {
        this.drawLeftText(
          `${this.checkout().items[i].item_name} ${this.checkout().items[i].variation.variation_name}`,
          leftPosition,
          cursor,
        );
        cursor += lineSpace;
        this.drawRightText(
          `${this.checkout().items[i].amount}ヶ ${this.convertcurrency(this.checkout().items[i].money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }

      cursor += lineSpace;

      this.cvscontext.fillRect(0, cursor - 2, receiptWidth, 2); // Underline
      if (this.checkout().postage_money > 0) {
        this.drawLeftText('冬物送料（税込）', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().postage_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }
      if (this.checkout().postage2_money > 0) {
        this.drawLeftText('夏物送料（税込）', leftPosition, cursor);
        this.drawRightText(
          `${this.convertcurrency(this.checkout().postage2_money)}円`,
          rightPosition,
          cursor,
        );
        cursor += lineSpace;
      }
      this.drawLeftText('内消費税（10%）', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().total_tax_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;
      this.drawLeftText('合計', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().total_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;

      cursor += lineSpace;

      this.drawLeftText('お預かり', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().receive_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;
      this.drawLeftText('お釣り', leftPosition, cursor);
      this.drawRightText(
        `${this.convertcurrency(this.checkout().change_money)}円`,
        rightPosition,
        cursor,
      );
      cursor += lineSpace;

      cursor += lineSpace;

      this.drawLeftText('身近なテーラー「仕立館」', leftPosition, cursor);
      cursor += lineSpace;
      this.drawLeftText('(株)大久保洋服店', leftPosition, cursor);
      cursor += lineSpace;

      let image = document.getElementById('hoseiecqr') as HTMLImageElement;
      this.cvscontext.drawImage(image, 0, cursor, image.width, image.height);
    }
  }

  drawLeftText(text, lposition, csr) {
    if (this.cvscontext) {
      this.cvscontext.textAlign = 'left';
      this.cvscontext.fillText(text, lposition, csr);
      this.cvscontext.textAlign = 'start';
    }
  }

  drawCenterText(text, cposition, csr) {
    if (this.cvscontext) {
      this.cvscontext.textAlign = 'center';
      this.cvscontext.fillText(text, cposition, csr);
      this.cvscontext.textAlign = 'start';
    }
  }

  drawRightText(text, rposition, csr) {
    if (this.cvscontext) {
      this.cvscontext.textAlign = 'right';
      this.cvscontext.fillText(text, rposition, csr);
      this.cvscontext.textAlign = 'start';
    }
  }

  sendMessageCanvas(logoScale) {
    if (this.cvscontext) {
      let trader = new StarWebPrintTrader({ url: this.printerurl });
      try {
        let builder = new StarWebPrintBuilder();
        let request = '';
        request += builder.createInitializationElement();
        request += builder.createBitImageElement({
          context: this.cvscontext,
          x: 0,
          y: 0,
          width: this.canvasPaper().nativeElement.width,
          height: this.canvasPaper().nativeElement.height,
        });
        request += builder.createCutPaperElement({ feed: true });
        trader.sendMessage({ request: request });
      } catch (e) {
        console.log(e.message);
      }
    }
  }

  async registorderandpayment() {
    const lineitems = [];
    for (const i in this.checkout().items) {
      lineitems.push({
        quantity: String(this.checkout().items[i].amount),
        catalog_object_id: this.checkout().items[i].variation.variation_id,
        applied_taxes: [
          {
            tax_uid: 'consumption_tax',
          },
        ],
      });
    }
    // 冬物送料の追加
    if (this.measurement().includepostage) {
      lineitems.push({
        quantity: '1',
        catalog_object_id: this.postageitem.variation_id,
        applied_taxes: [
          {
            tax_uid: 'consumption_tax',
          },
        ],
      });
    }
    // 夏物送料の追加
    if (this.measurement().includepostage2) {
      lineitems.push({
        quantity: '1',
        catalog_object_id: this.postageitem.variation_id,
        applied_taxes: [
          {
            tax_uid: 'consumption_tax',
          },
        ],
      });
    }

    const paymethod = this.checkmethod() == 'CASH' ? this.checkmethod() : 'EXTERNAL';
    const reqorder = {
      reference_id: this.customerinfo().reference_id,
      customer_uid: this.customerinfo().customer_uid,
      customer_name: this.customerinfo().customer_family_name + this.customerinfo().customer_given_name,
      square_customer_uid: this.customerinfo().square_customer_uid,
      line_items: lineitems,
      total_money: this.checkout().total_money,
      receive_money: this.checkout().receive_money,
      change_money: this.checkout().change_money,
    };
    console.log('reqorder:', reqorder);
    return await Promise.resolve()
      .then(() => {
        return this.fnaService.setorderandpaymenttosquare(
          this.staService.office,
          paymethod,
          reqorder,
        );
      })
      .then(async (respay) => {
        console.log('respay:', respay);
        const payment_method = paymethod == 'CASH' ? 'CASH' : 'OTHER';
        await this.staService
          .setcartorder(
            this.customerinfo().customer_uid,
            respay.payment.order_id,
            respay.payment.id,
            payment_method,
            this.checkout().receive_money,
            this.checkout().change_money,
            this.checkout().total_money,
            this.checkout().earned_at,
          )
          .then(() => {
            this.patchcheckout({ square_order_id: respay.payment.order_id });
            this.patchcheckout({ square_payment_id: respay.payment.id });
            this.patchcheckout({ payment_method: payment_method });
            this.patchvisible({ canregist: false });
            if (this.checkout().payment_method == 'CASH') {
              this.patchvisible({ other: false });
              this.patchvisible({ cash: true });
              this.patchvisible({ input: false });
              this.patchvisible({ result: true });
            } else {
              this.patchvisible({ other: false });
              this.patchvisible({ cash: false });
              this.patchvisible({ input: false });
              this.patchvisible({ result: false });
            }
          })
          .catch((error) => {
            throw error;
          });
        return respay.payment;
      })
      .catch((error) => {
        throw error;
      });
  }

  msgdlgclose() {
    this.dialogdisplay.set(false);
    this.dialogmsg.set('');
  }

  // レシート発行
  async issuereceipt() {
    if (!this.checkout().square_order_id) {
      this.dialogdisplay.set(true);
      this.dialogmsg.set('Squareの売上情報がありません。');
      return;
    }

    if (this.checkout().payment_method) {
      this.checkmethod.set(this.checkout().payment_method);
    }
    console.log('checkmethod:', this.checkmethod());
    this.canvasheight.set(this.adjustreceiptheight());
    console.log('canvasheight:', this.canvasheight());
    await lastValueFrom(this.staService.getreceipt(this.customerinfo().customer_uid)).then(
      async (receipt) => {
        const new_issue_no = receipt.issue_no + 1;
        await this.staService.setreceiptissues(this.customerinfo().customer_uid, new_issue_no);
        this.makereceipt(28, 28, 384, 1, new_issue_no);
        this.sendMessageCanvas(1);
      },
    );
  }

  async issuereceiptnumber() {
    this.staService.getreceipt(this.customerinfo().customer_uid).subscribe({
      next: (receipt) => {
        const new_issue_no = receipt.issue_no + 1;
        this.staService.setreceiptissues(this.customerinfo().customer_uid, new_issue_no);
      },
    });
  }

  // 明細表示
  async printreceipt() {
    if (this.checkout().payment_method) {
      this.checkmethod.set(this.checkout().payment_method);
    }
    this.checkmethod();
    console.log('checkmethod:', this.checkmethod());
    this.canvasheight.set(this.adjustcanvasheight(this.checkmethod()));
    await commonlib.sleep(100);
    console.log('canvasheight:', this.canvasheight());
    this.patchcheckout({ earned_at: new Date().toISOString() });
    this.makepurchasestaement(28, 28, 384, 1);
    this.sendMessageCanvas(1);
  }

  routingmeasuring() {
    this.router.navigate(['measuring', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingpurchase() {
    this.router.navigate(['purchasing', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingshoppingcart() {
    this.router.navigate(['cart', { customer_uid: this.customerinfo().customer_uid }]);
  }

  refundorder() {
    console.log('checkout:', this.checkout());
    this.canrefund.set(false);
    this.splashmsg.set('払い戻しを登録しています…');
    this.splashdisplay.set(true);
    Promise.resolve()
      .then(() => {
        return this.fnaService.refundpaymenttosquare(
          this.staService.office,
          this.checkout().square_payment_id,
          this.checkout().total_money,
        );
      })
      .then((resrefund) => {
        console.log('resrefund:', resrefund);
        return this.staService.setcartorder(
          this.customerinfo().customer_uid,
          null,
          null,
          null,
          0,
          0,
          0,
          null,
        );
      })
      .then(() => {
        return this.staService.clearreceiptissue(this.customerinfo().customer_uid);
      })
      .then(() => {
        this.patchcheckout({ square_order_id: null });
        this.patchcheckout({ square_payment_id: null });
        this.patchcheckout({ payment_method: null });
        this.patchcheckout({ change_money: 0 });
        this.patchcheckout({ receive_money: 0 });
        this.checkmethod.set('');
        this.patchvisible({ canregist: true });
        this.patchvisible({ other: false });
        this.patchvisible({ cash: false });
        this.patchvisible({ input: false });
        this.patchvisible({ result: false });
        this.splashdisplay.set(false);
      })
      .catch((error) => {
        this.splashdisplay.set(false);
        commonlib.errorlog(error);
      });
  }

  accountkeydown(event: KeyboardEvent) {
    switch (event.code) {
      case 'Digit0':
        this.inputzero();
        break;
      case 'Digit1':
        this.inputcheck(1);
        break;
      case 'Digit2':
        this.inputcheck(2);
        break;
      case 'Digit3':
        this.inputcheck(3);
        break;
      case 'Digit4':
        this.inputcheck(4);
        break;
      case 'Digit5':
        this.inputcheck(5);
        break;
      case 'Digit6':
        this.inputcheck(6);
        break;
      case 'Digit7':
        this.inputcheck(7);
        break;
      case 'Digit8':
        this.inputcheck(8);
        break;
      case 'Digit9':
        this.inputcheck(9);
        break;
      case 'Backspace':
        this.backspacecheck();
        break;
      case 'Escape':
        this.removecheck();
        break;
      default:
        break;
    }
  }

  inputaddress(event) {
    let value = (event.currentTarget as HTMLInputElement).value;
    if (value == '') value = null;
    this.targetcheckcomment().receipt_address = value;
    this.updatereceiptcomment();
  }

  inputproviso(event) {
    let value = (event.currentTarget as HTMLInputElement).value;
    if (value == '') value = null;
    this.targetcheckcomment().receipt_proviso = value;
    this.updatereceiptcomment();
  }

  updatereceiptcomment() {
    if (this.targetcheckcomment().receipt_address == '')
      this.targetcheckcomment().receipt_address = null;
    if (this.targetcheckcomment().receipt_proviso == '')
      this.targetcheckcomment().receipt_proviso = null;
    if (this.customerinfo()) {
      this.staService
        .setcheckcomment(this.customerinfo().customer_uid, this.targetcheckcomment())
        .then(() => {
          console.log('updated');
        });
    }
  }
}
