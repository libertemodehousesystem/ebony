import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router'; 

import { forkJoin, from, Subject, Subscription } from 'rxjs';
import { concatMap, debounceTime } from 'rxjs/operators';

import { map } from 'rxjs/operators';

import { AuthaccessService } from '../services/authaccess.service';
import { StoreaccessService, Customer, emptyCustomer } from '../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CustomerinfoComponent } from '../commons/customerinfo/customerinfo.component';

@Component({
  imports: [FormsModule, NgClass, CustomerinfoComponent],
  selector: 'app-measuring',
  templateUrl: './measuring.component.html',
  styleUrls: ['./measuring.component.scss']
})
export class MeasuringComponent implements OnInit,OnDestroy {
  private router = inject(Router);
  private activatedroute = inject(ActivatedRoute);
  private auaService = inject(AuthaccessService);
  private staService = inject(StoreaccessService);

  cansearch = false;

  readonly customerinfo = signal<Customer>(emptyCustomer());

  readonly rev_customer_uid = signal<string | null>(null);

  items = [];
  readonly filtereditems = signal<any[]>([]);

  shops = [];
  genders;

  cartplates = [];

  targetshop = null;
  readonly targetgender = signal<any>(null);

  readonly measurement = signal<any>({
    matashita: 0,
    skirttake: 0,
    ext01_name: "",
    ext01_length: 0,
    ext02_name: "",
    ext02_length: 0,
    remark: "",
    remark2: "",
    includepostage: null,
    includepostage2: null,
  });

  readonly checkout = signal<any>({
    customer_uid: null,
    square_order_id: null,
    square_payment_id: null,
    payment_method: null,
    receive_money: 0,
    change_money: 0,
  });

  readonly msgdisplay = signal(false);
  readonly msgcontent = signal("");
  readonly msgcontent2 = signal("");

  readonly canaddcart = signal(true);

  readonly matashitamsgflg = signal(false);

  private customerstatsubscription: Subscription;

  // イベントをまとめる Subject
  autoSaveEvent: Subject<void> = new Subject<void>();

  // Subscribe 情報
  autoSaveSubscription: Subscription = null;

  ngOnInit(): void {
    const tailoruser = this.auaService.tailoruser;
    if(!tailoruser || !((tailoruser.role=="super")||(tailoruser.role=="operator"))){
      this.router.navigate([""]);
      return;
    }
    this.cansearch = tailoruser.role=="super";

    this.genders = this.staService.genders;
    this.getshops();
    forkJoin([
      this.getmeasuringitems(),
      this.getcartplates(),
    ]).subscribe({
      error: (error) => {
        commonlib.errorlog(error);
      }
    });
    this.customerstatsubscription = this.staService.customerState.subscribe({
      next: (customer) => {
        const shop = this.shops.find(v => v.shop_id==customer.shop_id);
        const gender = this.genders.find(v => v.gender_id==customer.gender_id);
        this.selectshop(shop);
        this.selectgender(gender);
        this.customerinfo.set(customer);
        forkJoin([
          this.staService.getcartmeasurement(customer.customer_uid),
          this.staService.getcartitems(customer.customer_uid),
          this.staService.getcartorder(customer.customer_uid),
        ]).subscribe({
          next: (results) => {
            this.measurement.set(results[0]);
            const cartitems = results[1];
            for(const item of this.filtereditems()){
              if(!item.diffsizing){
                const cartitem = cartitems.find(v => v.item_id==item.item_id);
                if(cartitem){
                  item.amount = cartitem.amount;
                  item.check_variation = cartitem.variation.variation_id;
                }
              }
              else{
                const filtercartitems = cartitems.filter(v => v.item_id==item.item_id);
                item.diffsizeitems = [];
                for(const j in filtercartitems){
                  const variation = item.variations.find(v => v.variation_id==filtercartitems[j].variation.variation_id);
                  item.diffsizeitems.push({
                    amount: filtercartitems[j].amount,
                    cartitem_id: filtercartitems[j].cartitem_id,
                    customer_uid: filtercartitems[j].customer_uid,
                    item_id: filtercartitems[j].item_id,
                    item_name: item.item_name,
                    plate_id: filtercartitems[j].plate_id,
                    variation: {
                      price: filtercartitems[j].variation.price,
                      sku: filtercartitems[j].variation.sku,
                      variation_id: filtercartitems[j].variation.variation_id,
                      variation_name: variation.variation_name,
                      ordinal: variation.ordinal,
                    }
                  })                
                }
                item.diffsizeitems.sort((a,b) => {
                  if(a.variation.ordinal > b.variation.ordinal) return 1;
                  if(a.variation.ordinal < b.variation.ordinal) return -1;
                  return 0;
                })
              }
            }
            this.filtereditems.update(items => [...items]);
            this.setcheckout(customer.customer_uid, results[2]);
            this.matashitamsgflg.set(false);
          },
          error: (error) => {
            commonlib.errorlog(error);
          }
        })
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
    this.activatedroute.paramMap.subscribe(
      (routeparams) => {
        const rev_customer_uid = routeparams.get("customer_uid");
        this.rev_customer_uid.set(rev_customer_uid);
        if(rev_customer_uid){
          this.staService.gettailorcustomer(rev_customer_uid).subscribe(
            (res_customer) => {
              this.customerinfo.set(res_customer);
              this.staService.sendcustomerchange(res_customer);
            }
          )
        }
      }
    )
    // 遅延オートセーブ用
    this.autoSaveSubscription = this.autoSaveEvent.pipe(
      debounceTime(1000),
      concatMap(() => this.spotregistcart()),

    ).subscribe({
      next:() => {
        // メッセージの表示
        if(!this.canaddcart()){
          this.showmessage("登録しました。");
          this.canaddcart.set(true);
        }
      },
      error:() => {
        if(!this.canaddcart()){
          this.showmessage("問題が発生しました。");
          this.canaddcart.set(true);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if(this.customerstatsubscription){
      this.customerstatsubscription.unsubscribe();
    }
    if(this.autoSaveSubscription){
      this.autoSaveSubscription.unsubscribe();
    }
  }

  getcartplates(){
    return this.staService.getcartplates().pipe(
      map((resplates) => {
        this.cartplates = resplates;
      })
    )
  }

  selectshop(value){
    this.targetshop = value;
    this.generatefiltereditems();
  }

  selectgender(value){
    this.targetgender.set(value);
    this.generatefiltereditems();
  }

  getshops(){
    this.staService.getshops().subscribe({
      next: (resshops) => {
        this.shops = resshops;
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  getmeasuringitems(){
    return this.staService.getmeasuringitems(true).pipe(
      map((resitems) => {
        this.items = resitems;
      })
    )
  }

  getcheckout(customer_uid){
    return this.staService.getcartorder(customer_uid).pipe(
      map((rescheckout) => {
        this.setcheckout(customer_uid, rescheckout);
        return rescheckout;
      })
    )
  }


  private setcheckout(customer_uid, order){
    this.checkout.set({
      customer_uid: customer_uid,
      payment_method: order.payment_method,
      square_order_id: order.square_order_id,
      square_payment_id: order.square_payment_id,
      change_money: order.change_money,
      receive_money: order.receive_money,
    });
  }

  private showmessage(content: string, content2: string = ""){
    this.msgcontent.set(content);
    this.msgcontent2.set(content2);
    this.msgdisplay.set(true);
  }

  generatefiltereditems(){
    const filtereditems = [];
    if(this.targetshop && this.targetgender()){
      for(const i in this.items){
        const item = this.items[i];
        const shop = item.shops.find(v => v.shop_id==this.targetshop.shop_id);
        const gender = item.genders.find(v => v.gender_id==this.targetgender().gender_id);
        if(shop && gender){
          // deepcopy
          const genders = []
          for(const i in item.genders){
            genders.push({
              gender_id: item.genders[i].gender_id,
              caption: item.genders[i].caption,
            })
          }
          const shops = [];
          for(const i in item.shops){
            shops.push({
              shop_id: item.shops[i].shop_id,
              shop_name: item.shops[i].shop_name,
              created_at: item.shops[i].created_at,
            })
          }
          let cartplate = null;
          if(item.cartplate){
            const cartgenders = [];
            for(const i in item.cartplate.genders){
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
            }
          }
          const variations = [];
          for(const i in item.variations){
            if(item.variations[i].candisplay=="visible"){
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
            diffsizing: item.diffsizing,
            variations: variations,
            amount: 0,
            check_variation: null,
            created_at: item.created_at,
            diffsizeitems: [],
          })
        }
      }
      filtereditems.sort((a,b) => {
        if(a.diffsizing > b.diffsizing) return 1;
        if(a.diffsizing < b.diffsizing) return -1;
        return 0;
      });
    }
    this.filtereditems.set(filtereditems);
  }

  changeamount(item,value){
    if(value < 0){
      if(item.amount > 0){
        item.amount = item.amount + value;
      }
    }
    else{
      item.amount = item.amount + value;
    }
    // 個数変更時に登録する
    this.autoSaveEvent.next();
  }

  itemclear(item){
    item.check_variation = null;
    const elements = Array.from(document.getElementsByName("variation"+item.item_id));
    elements.forEach((element:HTMLInputElement) => {
      element.checked = false;
    });
    item.amount = 0;
    // クリア時に登録する
    this.autoSaveEvent.next();
  }

  variationchange(item,variation){
    item.check_variation = variation.variation_id;
    if(item.amount==0){
      item.amount++;
    }
    // 変更時に登録する
    this.autoSaveEvent.next();
  }

  spotregistcart(){
    const cartitems = [];
    for(const i in this.filtereditems()){
      if(!this.filtereditems()[i].diffsizing){
        const variation = this.filtereditems()[i].variations.find(v => v.variation_id==this.filtereditems()[i].check_variation);
        if(variation){
          cartitems.push({
            customer_uid: this.customerinfo().customer_uid,
            cartitem_id: null,
            item_id: this.filtereditems()[i].item_id,
            plate_id: this.filtereditems()[i].cartplate.plate_id,
            amount: this.filtereditems()[i].amount,
            variation: {
              variation_id: variation.variation_id,
              sku: variation.sku,
              price: variation.price,
              // ここで必要ならサイズを指定
              matashita: variation.matashita ? variation.matashita : null,
            }
          })
        }
      }
      else{
        for(const j in this.filtereditems()[i].diffsizeitems){
          cartitems.push({
            customer_uid: this.customerinfo().customer_uid,
            // cartitem_id: this.filtereditems()[i].diffsizeitems[j].cartitem_id,
            cartitem_id: null,
            item_id: this.filtereditems()[i].diffsizeitems[j].item_id,
            plate_id: this.filtereditems()[i].diffsizeitems[j].plate_id,
            amount: this.filtereditems()[i].diffsizeitems[j].amount,
            variation: {
              variation_id: this.filtereditems()[i].diffsizeitems[j].variation.variation_id,
              sku: this.filtereditems()[i].diffsizeitems[j].variation.sku,
              price: this.filtereditems()[i].diffsizeitems[j].variation.price,
              // ここで必要ならサイズを指定
              matashita: this.filtereditems()[i].diffsizeitems[j].variation.matashita ? this.filtereditems()[i].diffsizeitems[j].variation.matashita : null,
            }
          })
        }
      }
    }

    return this.spotregistfrom(cartitems);

  }

  spotregistfrom(cartitems){
    return from(
      Promise.resolve()
      .then(() => {
        return this.staService.setcartmeasurement(this.customerinfo().customer_uid, this.measurement());
      })
      .then(() => {
        return this.staService.allmeasuringdeletecartitem(this.customerinfo().customer_uid);
      })
      .then(async () => {
        for(const i in cartitems){
          await this.staService.setcartitem(this.customerinfo().customer_uid, cartitems[i]);
        }
      })
      .catch((error) => {
        commonlib.errorlog(error);
      })
    );
  }

  registcart(){
    this.canaddcart.set(false);
    const str_matachita = String(this.measurement().matashita);
    if(str_matachita.length > 0){
      this.matashitamsgflg.set(false);
    }
    else{
      this.showmessage("股下の数値が確定されていません。", "確認したらもう一度、カートに登録してください。");
      this.canaddcart.set(true);
      this.matashitamsgflg.set(true);
      return ;
    }
    if(this.checkout().square_order_id){
      this.showmessage("既にお会計が済んでいます。");
      this.canaddcart.set(true);
      return ;
    }
    this.autoSaveEvent.next();

    //         customer_uid: this.customerinfo().customer_uid,
    //         cartitem_id: null,
    //         item_id: this.filtereditems()[i].item_id,
    //         plate_id: this.filtereditems()[i].cartplate.plate_id,
    //         amount: this.filtereditems()[i].amount,
    //           variation_id: variation.variation_id,
    //           sku: variation.sku,
    //           price: variation.price,
    //           // ここで必要ならサイズを指定
    //           matashita: variation.matashita ? variation.matashita : null,
    //         customer_uid: this.customerinfo().customer_uid,
    //         // cartitem_id: this.filtereditems()[i].diffsizeitems[j].cartitem_id,
    //         cartitem_id: null,
    //         item_id: this.filtereditems()[i].diffsizeitems[j].item_id,
    //         plate_id: this.filtereditems()[i].diffsizeitems[j].plate_id,
    //         amount: this.filtereditems()[i].diffsizeitems[j].amount,
    //           variation_id: this.filtereditems()[i].diffsizeitems[j].variation.variation_id,
    //           sku: this.filtereditems()[i].diffsizeitems[j].variation.sku,
    //           price: this.filtereditems()[i].diffsizeitems[j].variation.price,
    //           // ここで必要ならサイズを指定
    //           matashita: this.filtereditems()[i].diffsizeitems[j].variation.matashita ? this.filtereditems()[i].diffsizeitems[j].variation.matashita : null,

    //   // メッセージの表示
  }

  accordionclick(event:MouseEvent){
    const target = event.currentTarget as HTMLElement;
    const accordion = target.getAttribute("accordion");
    if(accordion=="open"){
      target.setAttribute("accordion","close");
    }
    else{
      target.setAttribute("accordion","open");
    }
  }

  closemessege(){
    this.msgdisplay.set(false);
  }

  remarkaccordionclick(event:MouseEvent){
    const target = event.currentTarget as HTMLElement;
    const accordion = target.getAttribute("accordion");
    if(accordion=="open"){
      target.setAttribute("accordion","close");
    }
    else{
      target.setAttribute("accordion","open");
    }
  }

  routingpurchase(){
    this.router.navigate(["purchasing",{ customer_uid: this.customerinfo().customer_uid }]);
  }

  routingaccounting(){
    this.router.navigate(["accounting",{ customer_uid: this.customerinfo().customer_uid }]);
  }

  routingshoppingcart(){
    this.router.navigate(["cart",{ customer_uid: this.customerinfo().customer_uid }]);
  }

  amountchange(event:MouseEvent,item,value){
    event.preventDefault();
    const after = item.amount + value;
    if(after < 0){
      item.amount = 0;
    }
    else{
      item.amount += value;
    }
  }

  adddiffsizeitems(event,item){
    if(item.amount==0){
      this.showmessage("数量が0個です。");
      return;
    }
    if(!item.check_variation){
      this.showmessage("サイズが指定されていません。");
      return;
    }
    const genders = [];
    for(const i in item.genders){
      genders.push({
        caption: item.genders[i].caption,
        gender_id: item.genders[i].gender_id,
      });
    }
    const cartplategenders = [];
    for(const i in item.cartplate.genders){
      cartplategenders.push({
        caption: item.cartplate.genders[i].caption,
        gender_id: item.cartplate.genders[i].gender_id,
      });
    }
    const shops = [];
    for(const i in item.shops){
      shops.push({
        shop_id: item.shops[i].shop_id,
        shop_name: item.shops[i].shop_name,
        created_at: item.shops[i].created_at,
      })
    }
    const variations = [];
    for(const i in item.variations){
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
        matashita: item.variations[i].matashita ? item.variations[i].matashita : null,
      })
    }
    const variation = item.variations.find(v => v.variation_id==item.check_variation)
    const additem = {
      amount: item.amount,
      cartitem_id: null,
      customer_uid: this.customerinfo().customer_uid,
      item_id: item.item_id,
      item_name: item.item_name,
      plate_id: item.cartplate.plate_id,
      variation: {
        price: variation.price,
        sku: variation.sku,
        variation_id: variation.variation_id,
        variation_name: variation.variation_name,
        ordinal: variation.ordinal,
        matashita: variation.matashita ? variation.matashita : null,
      }
    }
    item.diffsizeitems.push(additem);
    item.diffsizeitems.sort((a,b) => {
      if(a.variation.ordinal > b.variation.ordinal) return 1;
      if(a.variation.ordinal < b.variation.ordinal) return -1;
      return 0;
    });
    item.amount = 0;
    item.check_variation = null;
    // 異なるサイズを入力した場合も登録する
    this.autoSaveEvent.next();
  }

  diffsizeitemamountchange(event:MouseEvent,item,value){
    event.preventDefault();
    const after = item.amount + value;
    if(after < 1){
      item.amount = 1;
    }
    else{
      item.amount += value;
    }
    // 異なるサイズの個数変更した場合も登録する
    this.autoSaveEvent.next();
  }

  diffsizeitemdelete(event:MouseEvent,diffsizeitems,i){
    event.preventDefault();
    diffsizeitems.splice(i,1);
    // 異なるサイズを削除した場合も登録する
    this.autoSaveEvent.next();
  }

  inputchange(){
    this.autoSaveEvent.next();
  }

  gototop(){
    const element = document.getElementById("measuringplate");
    element.scrollIntoView({ behavior: 'smooth' });
  }
}
