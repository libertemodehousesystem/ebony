import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

import { Customer, StoreaccessService } from '../../services/storeaccess.service';
import { FunctionaccessService } from '../../services/functionaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';

@Component({
  imports: [FormsModule, NgClass],
  selector: 'app-cartinfo',
  templateUrl: './cartinfo.component.html',
  styleUrls: ['./cartinfo.component.scss']
})
export class CartinfoComponent {
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  readonly customerinfo = signal<Customer>({
    customer_uid: null,
    qr_code_id: null,
    customer_family_kn_name: "",
    customer_given_kn_name: "",
    customer_family_name: "",
    customer_given_name: "",
    customer_parent_family_kn_name: "",
    customer_parent_given_kn_name: "",
    customer_parent_family_name: "",
    customer_parent_given_name: "",
    email: null,
    phone: null,
    zip_code: null,
    addrstate: null,
    addr1: null,
    addr2: null,
    addr3: null,
    gender_id: 0,
    shop_id: null,
    reference_id: null,
    square_customer_uid: null,
  });

  private postageitem = null;

  private genders = [];
  private shops = [];
  private items = [];
  private cartplates = [];

  readonly measurement = signal<any>({
    matashita: 0,
    skirttake: 0,
    ext01_name: "",
    ext01_length: 0,
    ext02_name: "",
    ext02_length: 0,
    includepostage: false,
    includepostage2: false,
  });

  readonly filteredcartplates = signal<any[]>([]);

  readonly cartmoney = signal({
    total_money: 0,
    total_tax_money: 0,
    postage_money: 0,
    postage2_money: 0,
  });

  readonly editable = signal(true);
  readonly loading = signal(false);
  readonly postageloading = signal(false);

  postages = this.staService.postages;
  readonly incpostage = signal(false);
  readonly incpostage2 = signal(false);

  readcustomer(customer: Customer){
    this.loading.set(true);
    this.customerinfo.set(customer);
    this.genders = this.staService.genders;
    if(!customer.customer_uid){
      return;
    }
    forkJoin([
      this.getshops(),
      this.getitems(),
      this.getcartplates(),
      this.staService.getcartmeasurement(customer.customer_uid),
      this.staService.getcartitems(customer.customer_uid),
      this.getpostageitem(),
    ]).subscribe({
      next: (results) => {
        this.shops = results[0];
        this.items = results[1];
        this.cartplates = results[2];
        const measurement = results[3];
        const cartitems = results[4];
        const shop = this.shops.find(v => v.shop_id==customer.shop_id);
        const gender = this.genders.find(v => v.gender_id==customer.gender_id);
        const filteredcartplates = this.generatefilteredcartplates(shop,gender);
        cartitems.sort((a,b) => {
          if(a.item_id > b.item_id) return 1;
          if(a.item_id < b.item_id) return -1;
          return 0;
        });
        let incpostage = false;
        let incpostage2 = false;
        for(const cartitem of cartitems){
          const cartplate = filteredcartplates.find(v => v.plate_id==cartitem.plate_id);
          if(cartplate){
            const item = this.items.find(v => v.item_id==cartitem.item_id);
            const postage = this.postages.find(v => v.postage_id==item.postage_id);
            const variation = item.variations.find(v => v.variation_id==cartitem.variation.variation_id);
            cartplate.cartitems.push({
              cartitem_id: cartitem.cartitem_id,
              item_id: cartitem.item_id,
              item_name: item ? item.item_name : "",
              variation_id: cartitem.variation.variation_id,
              variation_name: variation ? variation.variation_name : "",
              matashita: cartitem.variation.matashita,
              amount: cartitem.amount,
              postage: postage,
              unit_money: 0,
              total_money: 0,
              total_tax_money: 0,
            });
            if(item.postage_id==1){
              incpostage = true;
            }
            else if(item.postage_id==2){
              incpostage2 = true;
            }
          }
        }
        this.incpostage.set(incpostage);
        this.incpostage2.set(incpostage2);
        if(measurement.includepostage==null){
          measurement.includepostage = incpostage;
        }
        if(measurement.includepostage2==null){
          measurement.includepostage2 = incpostage2;
        }
        this.measurement.set(measurement);
        this.filteredcartplates.set(filteredcartplates);
        this.calcorder()
        .then((calcorder) => {
          this.aftercalcorder(calcorder);
          return this.staService.setcartmeasurement(customer.customer_uid,this.measurement());
        }).then(() => {
          this.loading.set(false);
        })
        .catch((error) => {
          commonlib.errorlog(error);
          this.loading.set(false);
        })
      }
    })
    this.staService.getcartorder(customer.customer_uid).subscribe({
      next: (order) => {
        this.editable.set(!order.square_order_id);
      }
    })
  }

  // 計算結果を金額欄と各カートアイテムに反映する
  aftercalcorder(calcorder){
    const lineitems = calcorder.line_items.filter(v => v.catalog_object_id!=this.postageitem.variation_id);
    for(const lineitem of lineitems){
      this.addcartitemonfiltered(lineitem);
    }
    const postage = calcorder.line_items.find(v => v.catalog_object_id==this.postageitem.variation_id);
    const measurement = this.measurement();
    this.cartmoney.set({
      total_money: calcorder.total_money.amount,
      total_tax_money: calcorder.total_tax_money.amount,
      postage_money: postage&&measurement.includepostage ? postage.total_money.amount : 0,
      postage2_money: postage&&measurement.includepostage2 ? postage.total_money.amount : 0,
    });
    this.filteredcartplates.update(plates => [...plates]);
  }

  getpostageitem(){
    return this.staService.getpostageitem().pipe(
      map((respostageitem) => {
        this.postageitem = respostageitem;
      })
    )
  }

  getshops(){
    return this.staService.getshops();
  }

  getitems(){
    return this.staService.getitems();
  }

  getcartplates(){
    return this.staService.getcartplates();
  }

  generatefilteredcartplates(shop,gender): any[] {
    const filteredcartplates = [];
    if(shop&&gender){
      for(const cartplate of this.cartplates){
        if(cartplate.genders.find(v => v.gender_id==gender.gender_id)){
          filteredcartplates.push({
            caption: cartplate.caption,
            genders: [...cartplate.genders],
            ordinal: cartplate.ordinal,
            plate_id: cartplate.plate_id,
            cartitems: [],
          });
        }
      }
      filteredcartplates.push({
        plate_id: null,
        caption: "その他",
        ordinal: 100,
        genders: [1,2],
        cartitems: [],
      });
    }
    return filteredcartplates;
  }

  async calcorder(){
    const office = this.staService.office;
    const measurement = this.measurement();
    const lineitems = [];
    for(const cartplate of this.filteredcartplates()){
      for(const cartitem of cartplate.cartitems){
        lineitems.push({
          quantity: String(cartitem.amount),
          catalog_object_id: cartitem.variation_id,
          applied_taxes: [
            {
              tax_uid: "consumption_tax"
            }
          ]
        })
      }
    }
    const postageline = {
      quantity: "1",
      catalog_object_id: this.postageitem?.variation_id,
      applied_taxes: [
        {
          tax_uid: "consumption_tax"
        }
      ]
    };
    // 冬物送料アイテムを足す
    if(this.postageitem&&measurement.includepostage){
      lineitems.push({...postageline});
    }
    // 夏物送料アイテムを足す
    if(this.postageitem&&measurement.includepostage2){
      lineitems.push({...postageline});
    }

    try {
      const calcresult = await this.fnaService.calcorder(this.customerinfo().customer_uid, lineitems, office);
      return calcresult.order;
    } catch (error) {
      commonlib.errorlog(error);
    }
  }

  recalcorder(){
    this.postageloading.set(true);
    this.calcorder()
    .then((calcorder) => {
      this.aftercalcorder(calcorder);
      return this.staService.setcartmeasurement(this.customerinfo().customer_uid,this.measurement());
    })
    .then(() => {
      this.postageloading.set(false);
    })
    .catch((error) => {
      commonlib.errorlog(error);
      this.postageloading.set(false);
    })
  }

  addcartitemonfiltered(line_item){
    for(const cartplate of this.filteredcartplates()){
      const cartitem = cartplate.cartitems.find(v => v.variation_id==line_item.catalog_object_id);
      if(cartitem){
        cartitem.unit_money = line_item.base_price_money.amount;
        cartitem.total_money = line_item.total_money.amount;
        cartitem.total_tax_money = line_item.total_tax_money.amount;
        return;
      }
    }
    return null;
  }

  // 金額の再計算
  private async recalcmoney(){
    try {
      this.aftercalcorder(await this.calcorder());
    } catch (error) {
      commonlib.errorlog(error);
    }
  }

  changeamount(cartitem,value){
    if(cartitem.amount + value > 0){
      cartitem.amount += value;
      this.filteredcartplates.update(plates => [...plates]);
      const customer_uid = this.customerinfo().customer_uid;
      if(customer_uid){
        this.staService.setcartitemamout(customer_uid,cartitem.cartitem_id,cartitem.amount)
        .then(() => this.recalcmoney())
        .catch((error) => {
          commonlib.errorlog(error);
        })
      }
    }
  }

  removecartitem(cartitems,i){
    const cartitem = cartitems.splice(i,1)[0];
    this.filteredcartplates.update(plates => [...plates]);
    this.staService.deletecartitem(this.customerinfo().customer_uid,cartitem.cartitem_id)
    .then(() => this.recalcmoney())
    .catch((error) => {
      commonlib.errorlog(error);
    })
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

  convertcurrency(value){
    return commonlib.currencyJP(value);
  }
}
