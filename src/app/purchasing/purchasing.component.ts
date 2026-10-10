import { AfterViewInit, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';

import { Customer, StoreaccessService, emptyCustomer } from '../services/storeaccess.service';

import { forkJoin, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AuthaccessService } from '../services/authaccess.service';

import { CartdlgComponent } from '../dialogs/cartdlg/cartdlg.component';

import * as commonlib from '@lib/shared/commons/libertelib';

import { CartAccessService } from '@lib/cartactions';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CustomerinfoComponent } from '../commons/customerinfo/customerinfo.component';

@Component({
  imports: [FormsModule, NgClass, CustomerinfoComponent, CartdlgComponent],
  selector: 'app-purchasing',
  templateUrl: './purchasing.component.html',
  styleUrls: ['./purchasing.component.scss'],
})
export class PurchasingComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private activatedroute = inject(ActivatedRoute);
  private auaService = inject(AuthaccessService);
  private staService = inject(StoreaccessService);
  private caaService = inject(CartAccessService);

  cansearch = false;

  readonly customerinfo = signal<Customer>(emptyCustomer());

  readonly rev_customer_uid = signal<string | null>(null);

  items = [];
  genders;
  shops = [];
  readonly filtereditems = signal<any[]>([]);

  targetshop;
  targetgender;

  cartitems = [];
  readonly cartamount = signal(0);
  readonly cartmsg = signal('');

  readonly cartdlg = viewChild<CartdlgComponent>('CartDlg');
  readonly cartdlgvisibility = signal<'hidden' | 'visible'>('hidden');

  measurement = {
    matashita: 0,
    skirttake: 0,
    ext01_name: '',
    ext01_length: 0,
    ext02_name: '',
    ext02_length: 0,
    remark: '',
    remark2: '',
    includepostage: true,
  };

  readonly targetremark2 = signal('');

  readonly checkout = signal<any>({
    customer_uid: null,
    square_order_id: null,
    square_payment_id: null,
    payment_method: null,
    receive_money: 0,
    change_money: 0,
  });

  private customerstatesubscription: Subscription;

  ngOnInit(): void {
    const tailoruser = this.auaService.tailoruser;
    if (!tailoruser || !(tailoruser.role == 'super' || tailoruser.role == 'operator')) {
      this.router.navigate(['']);
      return;
    }
    this.cansearch = tailoruser.role == 'super';
    this.genders = this.staService.genders;
    this.getshops();
    this.getpurchasingitems().subscribe();
    this.customerstatesubscription = this.staService.customerState.subscribe({
      next: (customer) => {
        this.customerinfo.set(customer);
        const shop = this.shops.find((v) => v.shop_id == customer.shop_id);
        const gender = this.genders.find((v) => v.gender_id == customer.gender_id);
        this.selectshop(shop);
        this.selectgender(gender);
        this.cartitems = [];
        forkJoin([
          this.staService.getcartitems(customer.customer_uid),
          this.staService.getcartmeasurement(customer.customer_uid),
          this.staService.getcartorder(customer.customer_uid),
        ]).subscribe({
          next: (results) => {
            this.cartitems = results[0];
            this.measurement = results[1];
            this.targetremark2.set(this.measurement.remark2);
            this.checkout.set({
              customer_uid: customer.customer_uid,
              payment_method: results[2].payment_method,
              square_order_id: results[2].square_order_id,
              square_payment_id: results[2].square_payment_id,
              change_money: results[2].change_money,
              receive_money: results[2].receive_money,
            });
            this.reflectcartitem();
          },
          error: (error) => {
            commonlib.errorlog(error);
          },
        });
      },
    });
    this.activatedroute.paramMap.subscribe({
      next: (routeparams) => {
        const rev_customer_uid = routeparams.get('customer_uid');
        this.rev_customer_uid.set(rev_customer_uid);
        if (rev_customer_uid) {
          this.staService.gettailorcustomer(rev_customer_uid).subscribe((res_customer) => {
            this.customerinfo.set(res_customer);
            this.staService.sendcustomerchange(res_customer);
          });
        }
      },
    });
  }

  ngAfterViewInit(): void {
    this.cartdlg().cartState.subscribe({
      next: (result) => {
        this.cartdlgvisibility.set('hidden');
        this.cartitems = [];
        this.staService.getcartitems(this.customerinfo().customer_uid).subscribe({
          next: (rescartitems) => {
            this.cartitems = rescartitems;
            this.reflectcartitem();
          },
          error: (error) => {
            commonlib.errorlog(error);
          },
        });
      },
    });
  }

  ngOnDestroy(): void {
    if (this.customerstatesubscription) {
      this.customerstatesubscription.unsubscribe();
    }
  }

  getshops() {
    this.staService.getshops().subscribe({
      next: (resshops) => {
        this.shops = resshops;
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });
  }

  getpurchasingitems() {
    return this.staService.getmeasuringitems(false).pipe(
      map((resitems) => {
        this.items = resitems;
        return resitems;
      }),
    );
  }

  selectshop(shop) {
    this.targetshop = shop;
    this.getfiltereditems();
  }

  selectgender(gender) {
    this.targetgender = gender;
    this.getfiltereditems();
  }

  getfiltereditems() {
    const filtereditems = [];
    if (this.targetshop && this.targetgender) {
      for (const i in this.items) {
        const item = this.items[i];
        const shop = item.shops.find((v) => v.shop_id == this.targetshop.shop_id);
        const gender = item.genders.find((v) => v.gender_id == this.targetgender.gender_id);
        if (shop && gender) {
          // deepcopy
          const genders = [];
          for (const i in item.genders) {
            genders.push({
              gender_id: item.genders[i].gender_id,
              caption: item.genders[i].caption,
            });
          }
          const shops = [];
          for (const i in item.shops) {
            shops.push({
              shop_id: item.shops[i].shop_id,
              shop_name: item.shops[i].shop_name,
              created_at: item.shops[i].created_at,
            });
          }
          let cartplate = null;
          if (item.cartplate) {
            const cartgenders = [];
            for (const i in item.cartplate.genders) {
              cartgenders.push({
                gender_id: item.cartplate.genders[i].gender_id,
                caption: item.cartplate.genders[i].caption,
              });
            }
            cartplate = {
              plate_id: item.cartplate.plate_id,
              genders: cartgenders,
              ordinal: item.cartplate.ordinal,
              caption: item.cartplate.caption,
            };
          }
          const variations = [];
          for (const i in item.variations) {
            if (item.variations[i].candisplay == 'visible') {
              variations.push({
                variation_id: item.variations[i].variation_id,
                variation_name: item.variations[i].variation_name,
                item_id: item.variations[i].item_id,
                ordinal: item.variations[i].ordinal,
                is_deleted: item.variations[i].is_deleted,
                present_at_all_locations: item.variations[i].present_at_all_locations,
                present_at_location_ids: item.variations[i].present_at_location_ids,
                price: item.variations[i].price,
                sku: item.variations[i].sku,
                linked_at: item.variations[i].linked_at,
                updated_at: item.variations[i].updated_at,
                candisplay: item.variations[i].candisplay,
              });
            }
          }

          filtereditems.push({
            item_id: item.item_id,
            item_name: item.item_name,
            item_category_id: item.item_category_id,
            item_background_color: item.item_background_color,
            item_color: item.item_color,
            item_index: item.item_index,
            genders: genders,
            shops: shops,
            cartplate: cartplate,
            showmeasuring: item.showmeasuring,
            variations: variations,
            amount: 0,
            accordion: false,
            check_variation: null,
            cartamount: 0,
            created_at: item.created_at,
          });
        }
      }
    }
    this.filtereditems.set(filtereditems);
    this.reflectcartitem();
  }

  reflectcartitem() {
    let total = 0;
    for (const item of this.filtereditems()) {
      item.cartamount = 0;
      for (const cartitem of this.cartitems.filter((v) => v.item_id == item.item_id)) {
        item.cartamount += cartitem.amount;
        total += cartitem.amount;
      }
    }
    this.cartamount.set(total);
    this.filtereditems.update((items) => [...items]);
  }

  amountchange(event: MouseEvent, item, value) {
    event.preventDefault();
    const after = item.amount + value;
    if (after < 0) {
      item.amount = 0;
    } else {
      item.amount += value;
    }
  }

  checkchange(item, variation) {
    item.check_variation = variation.variation_id;
    if (item.amount == 0) {
      item.amount++;
    }
  }

  acccodionchange(event: MouseEvent, item) {
    const target = event.target as HTMLInputElement;
    item.accordion = target.checked;
  }

  gototop() {
    const element = document.getElementById('purchesingplate');
    element.scrollIntoView({ behavior: 'smooth' });
  }

  addcart(event: MouseEvent, item) {
    event.preventDefault();
    const variation = item.variations.find((v) => v.variation_id == item.check_variation);
    if (!variation) {
      return;
    }
    //   customer_uid: this.customerinfo().customer_uid,
    //   cartitem_id: null,
    //   plate_id: item.cartplate ? item.cartplate.plate_id : null,
    //   item_id: item.item_id,
    //   amount: item.amount,
    //     variation_id: variation.variation_id,
    //     sku: variation.sku,
    //     price: variation.price,
    this.caaService
      .setcustomercartitems(
        this.customerinfo().customer_uid,
        item.amount,
        variation.variation_id,
        null,
        true,
      )
      .then((customercartitem) => {
        const index = this.seekcartitems(customercartitem);
        if (index >= 0) {
          this.cartitems[index].amount = customercartitem.amount;
        } else {
          this.cartitems.push(customercartitem);
        }
        this.reflectcartitem();
        this.cartmsg.set('カートに追加されました。');
        setTimeout(() => {
          this.cartmsg.set('');
        }, 3000);
      });
    const elements = Array.from(document.getElementsByName(item.item_id));
    elements.forEach((element: HTMLInputElement) => {
      element.checked = false;
    });
    item.amount = 0;
    this.filtereditems.update((items) => [...items]);
    const header = document.getElementById(`accordion${item.item_id}`);
    if (header) {
      header.click();
    }
  }

  seekcartitems(customercartitem) {
    for (let i = 0; i < this.cartitems.length; i++) {
      if (this.cartitems[i].variation.variation_id == customercartitem.variation.variation_id)
        return i;
    }
    return -1;
  }

  opencartdialog() {
    if (this.customerinfo().customer_uid) {
      this.cartdlg().opendialog();
      this.cartdlgvisibility.set('visible');
    }
  }

  remarkaccordionclick(event) {
    const target = event.currentTarget as HTMLElement;
    const accordion = target.getAttribute('accordion');
    if (accordion == 'open') {
      target.setAttribute('accordion', 'close');
    } else {
      target.setAttribute('accordion', 'open');
    }
  }

  inputremark2(event: MouseEvent) {
    const target = event.currentTarget as HTMLTextAreaElement;
    this.measurement.remark2 = target.value;
    this.staService
      .setcartmeasurement(this.customerinfo().customer_uid, this.measurement)
      .then(() => {
        //
      })
      .catch((error) => {
        console.log(error);
      });
  }

  routingmeasuring() {
    this.router.navigate(['measuring', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingaccounting() {
    this.router.navigate(['accounting', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingshoppingcart() {
    this.router.navigate(['cart', { customer_uid: this.customerinfo().customer_uid }]);
  }

}
