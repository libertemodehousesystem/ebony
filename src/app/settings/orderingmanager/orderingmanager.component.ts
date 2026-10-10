import { Component, inject, OnInit, signal } from '@angular/core';

import * as XLSX from 'xlsx';

import { StoreaccessService } from '../../services/storeaccess.service';
import { CartAccessService } from '@lib/cartactions';

import * as commonlib from '@lib/shared/commons/libertelib';
import { forkJoin, lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import {NgClass} from '@angular/common';

@Component({
  imports: [FormsModule, NgClass],
  selector: 'app-orderingmanager',
  templateUrl: './orderingmanager.component.html',
  styleUrls: ['./orderingmanager.component.scss']
})
export class OrderingmanagerComponent implements OnInit {

  private staService = inject(StoreaccessService);
  private caaService = inject(CartAccessService);

  readonly shops = signal<any[]>([]);
  readonly targetshop = signal<any>(null);
  genders;
  readonly targetgender = signal<any>(null);
  readonly summaries = signal<any[]>([]);
  readonly targetsummary = signal<any>(null);
  readonly showsummary = signal(false);

  cartplates = [];
  items = [];

  matrixitems = [];

  orderingcustomers = [];

  readonly orderingmatrix = signal<any[][]>([]);

  nendo = "2022";

  baseheaders = [
    "年度",
    "学校CD",
    "性別",
    "性別",
    "受験NO",
    "出席NO",
    "クラス",
    "取引CD",
    "フリガナ",
    "名前",
    "刺繍",
    "身長",
    "バスト",
    "ウエスト",
    "総丈",
    "ゆき丈",
    "袖丈",
    "ネック",
    "肩幅",
    "体重",
    "その他",
    "生年月日",
    "郵便番号",
    "住所",
    "ＴＥＬ１",
    "ＴＥＬ２",
    "保護者名",
    "メールアドレス",
    "備考１",
    "備考２",
    "備考３",
    "備考４",
    "備考５",
    "マンション",
    "足のサイズ",
    "ヒップ",
    "サイズ感",
    "常用漢字フラグ",
    "股下",
    "ズボン総丈",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]

  readonly headers: string[] = [];

  ngOnInit(): void {
    this.genders = this.staService.genders;
    this.loadinitdata();
  }

  async loadinitdata(){
    let cartitems = [];
    let customercarts = [];
    await Promise.resolve()
    .then(() => {
      return lastValueFrom(this.staService.gettailorcustomers())
    })
    .then((result) => {
      this.orderingcustomers = result;
      const customeruids = [];
      this.orderingcustomers.forEach((orderingcustomer) => {
        customeruids.push(orderingcustomer.customer_uid);
      })
      return lastValueFrom(this.staService.getfilteredcartitems(customeruids));
    })
    .then((result) => {
      cartitems = result;
      console.log("cartitems", cartitems);
      return lastValueFrom(this.staService.getallcustomercart())
    })
    .then((result) => {
      customercarts = result;
      console.log("customercarts:", customercarts);
    })
    .then((result) => {
      return lastValueFrom(this.staService.getcartplates())
    })
    .then((result) => {
      this.cartplates = result;
      console.log("cartplates:", this.cartplates);
      return lastValueFrom(this.staService.getitems())
    })
    .then((result) => {
      this.items = result;
      console.log("items:", this.items);
      return lastValueFrom(this.staService.getshops());
    })
    .then((result) => {
      this.shops.set(result);
      console.log("shops:", this.shops());
    });
    this.orderingcustomers.forEach((customer) => {
      const findcustomercart =  customercarts.find(v => v.customer_uid==customer.customer_uid);
      const customercartitems = cartitems.filter(v => v.customer_uid==customer.customer_uid);
      if(findcustomercart?.square_order_id){
        findcustomercart.cartitems = customercartitems;
        customer.customercart = findcustomercart;
      }
      else{
        customer.customercart = null;
      }
    })    
    console.log("orderingcustomers:",this.orderingcustomers);
  }

  getheaderelements(){
    forkJoin([
      this.staService.getcartplates(),
      this.staService.getitems(),
    ]).subscribe({
      next: (results) => {
        this.cartplates = results[0];
        this.items = results[1];
        console.log("cartplates:",this.cartplates);
        console.log("items:",this.items);
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  getshops(){
    this.staService.getshops().subscribe({
      next: (resp) => {
        this.shops.set(resp);
        console.log("shop:",this.shops());
      }
    })
  }

  changeshop(value){
    this.targetshop.set(this.shops().find(v => v.shop_id==value));
    if(this.targetshop() && this.targetgender()){
      this.generateorderinglist();
    }
  }

  changegender(gender_id){
    this.targetgender.set(this.genders.find(v => v.gender_id==gender_id));
    if(this.targetshop() && this.targetgender()){
      this.generateorderinglist();
    }
  }

  generateorderinglist(){
    this.matrixitems = [];
    for(const i in this.cartplates){
      const platingitems = this.items.filter(v => v.cartplate?.plate_id==this.cartplates[i].plate_id);
      for(const j in platingitems){
        if(platingitems[j].genders.find(v => v.gender_id==this.targetgender().gender_id)){
          if(platingitems[j].shops.find(v => v.shop_id==this.targetshop().shop_id)){
            this.matrixitems.push(platingitems[j]);
          }
        }
      }
    }
    // その他
    const platingitems = this.items.filter(v => v.cartplate?.plate_id==null);
    for(const j in platingitems){
      if(platingitems[j].genders.find(v => v.gender_id==this.targetgender().gender_id)){
        if(platingitems[j].shops.find(v => v.shop_id==this.targetshop().shop_id)){
          this.matrixitems.push(platingitems[j]);
        }
      }
    }
    console.log("matrixitems:",this.matrixitems);
    this.generateorderingmatrix();
  }

  getcustomercartitems(){
    forkJoin([
      this.staService.gettailorcustomers(),
      this.staService.getallcustomercart(),
      this.staService.getallcartitems(),
    ]).subscribe({
      next: (results) => {
        this.orderingcustomers = results[0];
        const customercarts = results[1];
        const cartitems = results[2];
        for(const i in this.orderingcustomers){
          const findcustomercart =  customercarts.find(v => v.customer_uid==this.orderingcustomers[i].customer_uid);
          const customercartitems = cartitems.filter(v => v.customer_uid==this.orderingcustomers[i].customer_uid);
          if(findcustomercart?.square_order_id){
            findcustomercart.cartitems = customercartitems;
            this.orderingcustomers[i].customercart = findcustomercart;
          }
          else{
            this.orderingcustomers[i].customercart = null;
          }
        }
        
        console.log("orderingcustomers:",this.orderingcustomers);
      }
    })
  }

  generateorderingmatrix(){
    const matrix: any[][] = [];
    // ヘッダー作成
    const headerrow = [];
    headerrow.push("性別");
    headerrow.push("生徒氏名カナ");
    headerrow.push("生徒氏名");
    headerrow.push("保護者氏名カナ");
    headerrow.push("保護者氏名");
    headerrow.push("郵便番号");
    headerrow.push("住所");
    headerrow.push("電話番号");
    headerrow.push("メールアドレス");
    //customercart
    headerrow.push("支払方法");
    headerrow.push("購入金額");
    headerrow.push("股下寸法（cm）");
    headerrow.push("スカート丈（cm）");
    headerrow.push("その他寸法１");
    headerrow.push("その他寸法１（cm）");
    headerrow.push("その他寸法２");
    headerrow.push("その他寸法２（cm）");
    headerrow.push("特記事項１");
    headerrow.push("特記事項２");
    for(const i in this.matrixitems){
      headerrow.push(this.matrixitems[i].item_name);
      headerrow.push("数量");
    }
    matrix.push(headerrow);
    for(const i in this.orderingcustomers){
      const row = [];
      const ordercustomer = this.orderingcustomers[i];
      if(this.targetgender().gender_id==this.orderingcustomers[i].gender_id && this.targetshop().shop_id==this.orderingcustomers[i].shop_id){
        row.push(this.seekgender(ordercustomer.gender_id));
        row.push(ordercustomer.customer_family_kn_name+ordercustomer.customer_given_kn_name);
        row.push(ordercustomer.customer_family_name+ordercustomer.customer_given_name);
        row.push(ordercustomer.customer_parent_family_kn_name+ordercustomer.customer_parent_given_kn_name);
        row.push(ordercustomer.customer_parent_family_name+ordercustomer.customer_parent_given_name);
        row.push(ordercustomer.zip_code ? ordercustomer.zip_code : "");
        row.push(this.getaddress(ordercustomer));
        row.push(ordercustomer.phone ? ordercustomer.phone : "");
        row.push(ordercustomer.email ? ordercustomer.email : "");
        //customercart
        row.push(ordercustomer.customercart?.payment_method ? ordercustomer.customercart?.payment_method : "");
        row.push(ordercustomer.customercart?.total_money ? ordercustomer.customercart?.total_money : 0);
        row.push(ordercustomer.customercart?.matashita ? ordercustomer.customercart?.matashita : "");
        row.push(ordercustomer.customercart?.skirttake ? ordercustomer.customercart?.skirttake : "");
        row.push(ordercustomer.customercart?.ext01_name ? ordercustomer.customercart?.ext01_name : "");
        row.push(ordercustomer.customercart?.ext01_length ? ordercustomer.customercart?.ext01_length : "");
        row.push(ordercustomer.customercart?.ext02_name ? ordercustomer.customercart?.ext02_name : "");
        row.push(ordercustomer.customercart?.ext02_length ? ordercustomer.customercart?.ext02_length : "");
        row.push(ordercustomer.customercart?.remark ? ordercustomer.customercart?.remark : "");
        row.push(ordercustomer.customercart?.remark2 ? ordercustomer.customercart?.remark2 : "");
        for(const j in this.matrixitems){
          const cartitems = ordercustomer.customercart?.cartitems.filter(v => v.item_id==this.matrixitems[j].item_id)
          if(cartitems?.length > 0){
            let variationname = "";
            let amount = "";
            for(const k in cartitems){
              const variation = this.seekvariation(cartitems[k].item_id,cartitems[k].variation.variation_id);
              if(variationname==""){
                if(cartitems[k].variation.matashita){
                  variationname = variation.variation_name + "," + cartitems[k].variation.matashita;
                }
                else{
                  variationname = variation.variation_name;
                }
              }
              else{
                if(cartitems[k].variation.matashita){
                  variationname += ","+variation.variation_name + "," + cartitems[k].variation.matashita;
                }
                else{
                  variationname += ","+variation.variation_name;
                }
              }
              if(amount==""){
                amount = cartitems[k].amount;
              }
              else{
                amount += "," + cartitems[k].amount;
              }
            }
            row.push(variationname);
            row.push(amount);
          }
          else{
            row.push("");
            row.push("");
          }
          
        }
        matrix.push(row);
      }
    }
    this.orderingmatrix.set(matrix);
  }

  seekcustomer(customer_uid){
    const customer = this.orderingcustomers.find(v => v.customer_uid==customer_uid);
    return customer;
  }

  seekgender(gender_id){
    const gender = this.genders.find(v => v.gender_id==gender_id);
    return gender ? gender.caption : "不明";
  }

  getaddress(customer){
    let address = "";
    address += customer.addrstate ? customer.addrstate : "";
    address += customer.addr1 ? customer.addr1 : "";
    address += customer.addr2 ? customer.addr2 : "";
    address += customer.addr3 ? customer.addr3 : "";
    return address;
  }

  seekvariation(item_id,variation_id){
    const item = this.items.find(v => v.item_id==item_id);
    if(item){
      const variation = item.variations.find(v => v.variation_id==variation_id);
      return variation ? variation : null;
    }
    else{
      return null;
    }
  }

  orderexportfile(){
    let ws_name = "Sheet1";
    let wb = XLSX.utils.book_new();
    let ws_data = [];
    for(const i in this.orderingmatrix()){
      const row = [];
      for(const j in this.orderingmatrix()[i]){
        row.push(this.orderingmatrix()[i][j])
      }
      ws_data.push(row);
    }
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `orderexport${this.targetshop().shop_name}${this.targetgender().caption}.xlsx`);
  }


  checkearnings(){
    this.summaries.set(this.squeezesummaries());
    console.log("summaries:",this.summaries());
    for(const i in this.orderingcustomers){
      const ordercustomer = this.orderingcustomers[i];
      const orderearnedat = ordercustomer.customercart?.earned_at ? ordercustomer.customercart?.earned_at.substring(0, 10) : null;
      const ordershopid = ordercustomer.shop_id;
      const summary = this.summaries().find(v => v.earned_at==orderearnedat&&v.shop_id==ordershopid);
      const orderpaymentmethod = ordercustomer.customercart?.payment_method ? ordercustomer.customercart?.payment_method : "NONE";
      if(summary){
        summary[orderpaymentmethod].total_money += ordercustomer.customercart?.total_money ? ordercustomer.customercart?.total_money : 0;
      }
    }
    console.log("summaries:", this.summaries());
    this.showsummary.set(true);
  }

  squeezesummaries(){
    const results = [];
    for(const i in this.orderingcustomers){
      const ordercustomer = this.orderingcustomers[i];
      const orderearnedat = ordercustomer.customercart?.earned_at ? ordercustomer.customercart?.earned_at.substring(0, 10) : null;
      const ordershopid = ordercustomer.shop_id;
      const result = results.find(v => v.earned_at==orderearnedat&&v.shop_id==ordershopid);
      if(!result){
        if(orderearnedat&&ordershopid){
          results.push({
            summary_id: commonlib.generateUid(),
            earned_at: orderearnedat,
            shop_id: ordershopid,
            CASH: {caption:"現金",total_money: 0},
            OTHER: {caption:"振込",total_money: 0},
            NONE: {caption:"その他",total_money: 0},
          })
        }
      }
    }
    return results;
  }

  getgendercaption(gender_id){
    const gender = this.genders.find(v => v.gender_id==gender_id);
    return gender ? gender.caption : "不明";
  }

  getshopcaption(shop_id){
    const shop = this.shops().find(v => v.shop_id==shop_id);
    return shop ? shop.shop_name : "不明";
  }

  getearnedat(earned_at){
    return earned_at ? earned_at : "不明";
  }

  changesummary(summary){
    this.targetsummary.set(summary);
  }

  currencyoutput(number: number){
    return number.toLocaleString();
  }

  closesumdialog(){
    this.showsummary.set(false);
  }

  checkorderstatus(customer_kn_name){
    for(const i in this.orderingcustomers){
      const kn_name = this.orderingcustomers[i].customer_family_kn_name+this.orderingcustomers[i].customer_given_kn_name;
      if(customer_kn_name==kn_name){

        console.log("this.orderingcustomer:", this.orderingcustomers[i]);
        this.caaService.ischecked(this.orderingcustomers[i].customer_uid)
        .then((ischecked) => {
          console.log("ischecked:", ischecked);
        })
      }
    }
  }
}
