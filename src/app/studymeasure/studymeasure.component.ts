import { Component, inject, signal } from '@angular/core';

import { FunctionaccessService } from '../services/functionaccess.service';
import { StoreaccessService } from '../services/storeaccess.service';

import { serviceUuidList } from '../lib/bleparams';

import * as commonlib from '@lib/shared/commons/libertelib';
import { lastValueFrom } from 'rxjs';
import { NgClass } from '@angular/common';

const getValueList = (value: DataView) => {
  const vl = {} as {[key: string]: string};
  const buffer = value.buffer;
  // UTF-8 で変換する
  const decoder = new TextDecoder("utf-8");
  vl["string"] = decoder.decode(value);
  vl["uint8"] = new Uint8Array(buffer).join(",");

  return vl;
}

@Component({
  imports: [NgClass],
  selector: 'app-studymeasure',
  templateUrl: './studymeasure.component.html',
  styleUrls: ['./studymeasure.component.scss']
})
export class StudymeasureComponent {
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  blemeasure = null;

  readonly blestructures = signal<any[]>([]);

  readonly customers = signal<any[]>([]);

  postageitem;

  searchdevices(){
    console.log("searchdevices");
    console.log(navigator.language);
    (window.navigator as any).bluetooth.requestDevice({
      acceptAllDevices:true,
      optionalServices: serviceUuidList,
    })
    .then((device) => {
      this.blemeasure = device;
      console.log("device:",device);
      console.log("name:",device.name);
      this.blemeasure.addEventListener("gattserverdisconnected", this.onDisconnected);
      return this.blemeasure.gatt.connect();
    })
    .then((server) => {
      console.log("server:",server);
      return server.getPrimaryServices();
    })
    .then(async (services) => {
      const blestructures = [];
      for(const service of services){
        const characteristics = await service.getCharacteristics();
        blestructures.push({
          service_uuid: service.uuid,
          characteristics: characteristics.map(c => c.uuid),
        });
      }
      this.blestructures.set(blestructures);
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  disconnectdevice(){
    if(this.blemeasure){
      if(this.blemeasure.gatt.connected){
        console.log("disconnect");
        this.blemeasure.gatt.disconnect();
      }
    }
  }

  onDisconnected(event) {
    // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
  }
  

  inputreport(e){
    console.log(e.device.productName + ": got input report " + e.reportId);
    console.log(new Uint8Array(e.data.buffer));
  }

  onChange(event){
    console.log("cahnge event");
    const characteristic = event.target;
  }

  async loadcustomercartitems(){
    console.log("read");
    let basecustomers = [];
    const customers = [];
    await Promise.resolve()
    .then(() => {
      return lastValueFrom(this.staService.getpostageitem());
    })
    .then((result) => {
      this.postageitem = result;
      console.log("postageitem:", this.postageitem);
      return lastValueFrom(this.staService.gettailorcustomers())
    })
    .then((result) => {
      basecustomers = result;
      const ids = [];
      basecustomers.forEach((customer) => {
        ids.push(customer.customer_uid);
      })
      return Promise.all([
        lastValueFrom(this.staService.getfilteredcustomercarts(ids)),
        lastValueFrom(this.staService.getfilteredcartitems(ids))
      ]);
    })
    .then((results) => {
      const customercarts = results[0];
      const cartitems = results[1];
      console.log("customercarts:", customercarts);
      console.log("cartitems", cartitems);
      customercarts.forEach((customercart) => {
        if(customercart.square_order_id){
          const customer = basecustomers.find(v => v.customer_uid==customercart.customer_uid);
          const findcartitems = cartitems.filter(v => v.customer_uid==customercart.customer_uid);
          customercart.cartitems = findcartitems;
          customer.customercart = customercart;
          customer.calcprice = 0;
          customers.push(customer);
          if(["ha3i9WVgdW7al9ViiISt", "xavdXBK81RZ8JMKJXxxx"].find(v => v==customer.customer_uid)){
            customer.canearning = false;
          }
          else{
            customer.canearning = true;
          }
        }
      });
      customers.sort((a, b) => {
        if(a.customercart.earned_at > b.customercart.earned_at) return 1;
        if(a.customercart.earned_at < b.customercart.earned_at) return -1;
        return 0;
      })
    });
    this.customers.set(customers);
    this.generatepaymerntdata();
  }

  generatepaymerntdata(){
    this.customers().forEach((customer) => {
      const lineitems = [];
      customer.customercart.cartitems.forEach((item) => {
        lineitems.push({
          quantity: String(item.amount),
          catalog_object_id: item.variation.variation_id,
          applied_taxes: [
            {
              tax_uid: "consumption_tax"
            }
          ]
        })
      })
      // 冬物送料の追加
      if(customer.customercart.includepostage){
        lineitems.push({
          quantity: "1",
          catalog_object_id: this.postageitem.variation_id,
          applied_taxes: [
            {
              tax_uid: "consumption_tax"
            }
          ]
        })
      }
      // 夏物送料の追加
      if(customer.customercart.includepostage2){
        lineitems.push({
          quantity: "1",
          catalog_object_id: this.postageitem.variation_id,
          applied_taxes: [
            {
              tax_uid: "consumption_tax"
            }
          ]
        })
      }
        
      customer.lineitems = lineitems;
    })
    this.customers.update(customers => [...customers]);
  }

  async calcorder(customer){
    console.log("calc");
    const office = this.staService.office;
    console.log("lineitems:", customer.lineitems);
    return await Promise.resolve()
    .then(() => {
      const req = {
        customer_uid: customer.customer_uid,
        lineitems: customer.lineitems,
        office: office,
      }
      console.log("req:", req);
      return this.fnaService.calcorder(req.customer_uid, req.lineitems, req.office);
    })
    .then((calcresult) => {
      console.log("calresult:",calcresult);
      customer.calcprice = calcresult.order.net_amount_due_money.amount;
      this.customers.update(customers => [...customers]);
      return calcresult.order;
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  async registorderpay(customer){
    const paymethod = customer.customercart.payment_method=="CASH" ? customer.customercart.payment_method : "EXTERNAL";
    const reqorder = {
      reference_id: customer.reference_id,
      customer_uid: customer.customer_uid,
      customer_name: customer.customer_family_name+customer.customer_given_name,
      square_customer_uid: customer.square_customer_uid,
      line_items: customer.lineitems,
      total_money: customer.customercart.total_money,
      receive_money: customer.customercart.receive_money,
      change_money: customer.customercart.change_money,
    }
    console.log("payment_method:", paymethod);
    console.log("reqorder:",reqorder);
    await Promise.resolve()
    .then(() => {
      return this.fnaService.setorderandpaymenttosquare(this.staService.office,paymethod,reqorder);
    })
    .then((respay) => {
      const reatoreearning = {
        customer_uid: customer.customer_uid,
        total_money: customer.customercart.total_money,
        receive_money: customer.customercart.receive_money,
        change_money: customer.customercart.change_money,
        payment_method: customer.customercart.payment_method,
        square_order_id: respay.payment.order_id,
        square_payment_id: respay.payment.id,
        earned_at: customer.customercart.earned_at,
        restored_at: new Date().toISOString(),
      }
      console.log("reatoreearning:", reatoreearning);
      return this.staService.setrestoreearning(reatoreearning);
    });

  }

  async refundrestoreearning(customer){
    const restoreearning = await this.staService.getrestoreearning(customer.customer_uid);
    console.log("restoreearning:", restoreearning);
    if(restoreearning.square_order_id&&restoreearning.square_payment_id){
      await Promise.resolve()
      .then(() => {
        return this.fnaService.refundpaymenttosquare(
          this.staService.office,
          restoreearning.square_payment_id,
          restoreearning.total_money);
      })
      .then((resrefund) => {
        console.log("resrefund:",resrefund);
      });
    }
  }

  createuuid(){
    const uuid = commonlib.generateUid();
    console.log("uuid:", uuid);
  }
}
