import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import * as XLSX from "xlsx";

import { Shop, StoreaccessService } from '../../services/storeaccess.service';
import { deliverykeys } from './deliverykey';
import { FormsModule } from '@angular/forms';
import {NgClass, SlicePipe} from '@angular/common';

@Component({
  imports: [FormsModule, NgClass, SlicePipe],
  selector: 'liberte-commerce-next-deliverylist',
  templateUrl: './deliverylist.component.html',
  styleUrls: ['./deliverylist.component.scss'],
})
export class DeliverylistComponent implements OnInit {
  private staService = inject(StoreaccessService);

  postages = this.staService.postages;
  postagechecks = [false, false];
  readonly listall = signal(false);
  readonly shippingDate = signal("");

  shops: Shop[] = [];

  customers = [];
  cartmeasurements = [];

  readonly filteredcartmeasurements = signal<any[]>([]);

  ngOnInit(): void {
    forkJoin([
      this.staService.gettailorcustomers(),
      this.staService.getscartmeasurement(),
      this.staService.getshops(),
    ])
    .subscribe({
      next: (results) => {
        this.customers = results[0];
        this.cartmeasurements = results[1];
        this.shops = results[2];
      }
    })
  }

  changefilter(){
    const filtered: any[] = [];
    this.customers.forEach((customer) => {
      let canadd = false;
      const cartmeasurement = this.cartmeasurements.find(v => v.customer_uid==customer.customer_uid);
      if(cartmeasurement){
        if(this.postagechecks[0]){
          if(cartmeasurement.includepostage){
          canadd = true;
          }
          else{
            const nullcheckcustomer = this.customers.find(v => v.customer_uid==cartmeasurement.customer_uid);
            if(cartmeasurement.includepostage===null&&nullcheckcustomer&&nullcheckcustomer.square_customer_uid){
              canadd = true;
            }
          }
        }
        if(this.postagechecks[1]){
          if(cartmeasurement.includepostage2){
            canadd = true;
          }
          else{
            const nullcheckcustomer = this.customers.find(v => v.customer_uid==cartmeasurement.customer_uid);
            if(cartmeasurement.includepostage2===null&&nullcheckcustomer&&nullcheckcustomer.square_customer_uid){
              canadd = true;
            }
          }
        }
        if(canadd){
          if(customer){
            let address = customer.addrstate ? customer.addrstate : "";
            address += customer.addr1 ? customer.addr1 : "";
            address += customer.addr2 ? customer.addr2 : "";
            address += customer.addr3 ? customer.addr3 : "";
            const deliverykeyData = deliverykeys.find(d => d.qr_code_id === customer.qr_code_id);
            const deliveryshop = this.shops.find(v => v.shop_id==customer.shop_id);
            const deliverycode = deliverykeyData ? deliveryshop.deliveryshopheader + deliverykeyData.deliverykey : "";
            filtered.push({
              deliverycode: deliverycode,
              customer_uid: customer.customer_uid,
              customer_name: customer.customer_family_name + customer.customer_given_name,
              customer_kn_name: customer.customer_family_kn_name + customer.customer_given_kn_name,
              zip_code: customer.zip_code,
              addrstate: customer.addrstate || "",
              addr1: customer.addr1 || "",
              addr2: customer.addr2 || "",
              addr3: customer.addr3 || "",
              address: address,
              phone: customer.phone,
              includepostage: cartmeasurement.includepostage,
              includepostage2: cartmeasurement.includepostage2,
            })
          }
        }
      }
    })
    this.filteredcartmeasurements.set(filtered);
  }

  nonfilter(){
    this.postagechecks[0] = false;
    this.postagechecks[1] = false;
    const filtered: any[] = [];
    if(!this.listall()){
      this.filteredcartmeasurements.set(filtered);
      return;
    }
    this.customers.forEach((customer) => {
      const cartmeasurement = this.cartmeasurements.find(v => v.customer_uid==customer.customer_uid);
      if(cartmeasurement){
        let address = customer.addrstate ? customer.addrstate : "";
        address += customer.addr1 ? customer.addr1 : "";
        address += customer.addr2 ? customer.addr2 : "";
        address += customer.addr3 ? customer.addr3 : "";
        const deliverykeyData = deliverykeys.find(d => d.qr_code_id === customer.qr_code_id);
        const deliveryshop = this.shops.find(v => v.shop_id==customer.shop_id);
        const deliverycode = deliverykeyData ? deliveryshop.deliveryshopheader + deliverykeyData.deliverykey : "";
        filtered.push({
          deliverycode: deliverycode,
          customer_uid: customer.customer_uid,
          customer_name: customer.customer_family_name + customer.customer_given_name,
          customer_kn_name: customer.customer_family_kn_name + customer.customer_given_kn_name,
          zip_code: customer.zip_code,
          addrstate: customer.addrstate || "",
          addr1: customer.addr1 || "",
          addr2: customer.addr2 || "",
          addr3: customer.addr3 || "",
          address: address,
          phone: customer.phone,
          includepostage: cartmeasurement.includepostage,
          includepostage2: cartmeasurement.includepostage2,
        })
      }
    })
    this.filteredcartmeasurements.set(filtered);
  }

  listexport(){
    const ws_name = "Sheet1";
    const wb = XLSX.utils.book_new();
    const ws_data = [];
    ws_data.push([
      "番号",
      "お客様名",
  		"お客様名（カナ）",
      "郵便番号",
      "住所",
      "電話番号",
      "冬物配送",
      "夏物配送"
    ]);
    this.filteredcartmeasurements().forEach((cartmeasurement, i) => {
      const row = [];
      row.push(String(i+1));
      row.push(cartmeasurement.customer_name);
      row.push(cartmeasurement.customer_kn_name);
      row.push(cartmeasurement.zip_code);
      row.push(cartmeasurement.address);
      row.push(cartmeasurement.phone);
      row.push(cartmeasurement.includepostage===false ? "無" : "有");
      row.push(cartmeasurement.includepostage2===false ? "無" : "有");
      ws_data.push(row);
    })
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `deliveryexport.xlsx`);
  }

  b2export(){
    if (!this.shippingDate()) {
      alert("出荷予定日を入力してください。");
      return;
    }

    const formattedDate = this.shippingDate().replace(/-/g, "/");
    const year = this.shippingDate().substring(0, 4);

    const ws_name = "Sheet1";
    const wb = XLSX.utils.book_new();
    const ws_data = [];
    ws_data.push([
      "送り状種類",
      "出荷予定日",
      "お届け先コード",
      "お届け先電話番号",
      "お届け先郵便番号",
      "お届け先住所",
      "お届け先アパートマンション名",
      "お届け先名",
      "ご依頼主電話番号",
      "ご依頼主郵便番号",
      "ご依頼主住所",
      "ご依頼主アパートマンション",
      "ご依頼主名",
      "品名１",
      "請求先顧客コード",
      "運賃管理番号",
    ]);
    this.filteredcartmeasurements().forEach((cartmeasurement) => {
      const row = [];
      const addressWithoutAddr3 = (cartmeasurement.addrstate || "") + (cartmeasurement.addr1 || "") + (cartmeasurement.addr2 || "");
      row.push(0);
      row.push(formattedDate);
      row.push(cartmeasurement.deliverycode.length > 0 ? year+cartmeasurement.deliverycode : "");
      row.push(cartmeasurement.phone || "");
      row.push(cartmeasurement.zip_code || "");
      row.push(addressWithoutAddr3);
      row.push(cartmeasurement.addr3 || "");
      row.push(cartmeasurement.customer_name || "");
      row.push("0447222901");
      row.push("2110063");
      row.push("神奈川県川崎市中原区小杉町3-4-3");
      row.push("メゾンプレール 1F");
      row.push("株式会社大久保洋服店");
      row.push("制服等");
      row.push("0447222901"),
      row.push("01"),
      ws_data.push(row);
    })
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, `b2_delivery_list.xlsx`);
  }
}
