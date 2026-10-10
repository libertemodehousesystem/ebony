import { Injectable } from '@angular/core';

import { lastValueFrom, map, Observable } from 'rxjs';

import * as commonlib from '@lib/shared/commons/libertelib';

//   getDoc,
//   doc,
//   getDocs,
//   collection,
//   Firestore,

import { FirestoreService } from '../../firestore.service';

export interface CustomerCartItem {
  amount: number;
  cartitem_id: string;
  customer_uid: string;
  item_id: string;
  plate_id: string;
  variation: {
    price: number;
    sku: string;
    variation_id: string;
    matashita: number | null;
  }
};

export interface CustomerCartInfo {
  matashita: number;
  skirttake: number;
  ext01_name: string | null;
  ext01_length: number;
  ext02_name: string | null;
  ext02_length: number;
  remark: string | null;
  remark2: string | null;
  includepostage: boolean;
}

export interface AnsCartItem {
  item_id: string;
  plate_id: string;
  variation: {
    price: number;
    sku: string;
    variation_id: string;
    matashita: number | null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CartAccessService {

  private _office: string = "SHITATEKAN";

  get office(): string{
    return this._office;
  }

  set office(office: string){
    this._office = office;
  }

  constructor(
    private afstore: FirestoreService,
  ) { }

  getcustomercartitems(customer_uid: string): Observable<CustomerCartItem[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems`).get()
    .pipe(
      map((snapshot) => {
        const results:CustomerCartItem[] = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            const variation = doc.get("variation");
            results.push({
              amount: doc.get("amount"),
              cartitem_id: doc.get("cartitem_id"),
              customer_uid: doc.get("customer_uid"),
              item_id: doc.get("item_id"),
              plate_id: doc.get("plate_id"),
              variation: {
                price: variation.price,
                sku: variation.sku,
                variation_id: variation.variation_id,
                matashita: variation.matashita ? variation.matashita : null,
              }
            });
          }
        }
        return results;
      })
    )
  }

  async setcustomercartitems(customer_uid: string, amount: number, variation_id: string, matashita: number, addition: boolean):Promise<CustomerCartItem>{
    if(amount <= 0){
      throw new Error("error/amount-less-than-zero: ");
    }
    const cartitem = await this.getitem(variation_id);
    if(cartitem){
      const customercartitem = await this.getsamevariation(customer_uid, variation_id);
      console.log("customercartitem:", customercartitem);
      let registitem:CustomerCartItem;
      if(customercartitem){
        registitem = {
          amount: addition ? customercartitem.amount + amount : amount,
          cartitem_id: customercartitem.cartitem_id,
          customer_uid: customercartitem.customer_uid,
          item_id: customercartitem.item_id,
          plate_id: customercartitem.plate_id,
          variation: {
            price: customercartitem.variation.price,
            sku: customercartitem.variation.sku,
            variation_id: customercartitem.variation.variation_id,
            matashita: matashita,
          }
        }
      }
      else{
        registitem = {
          amount: amount,
          cartitem_id: commonlib.generateUid(),
          customer_uid: customer_uid,
          item_id: cartitem.item_id,
          plate_id: cartitem.plate_id,
          variation: {
            price: cartitem.variation.price,
            sku: cartitem.variation.sku,
            variation_id: cartitem.variation.variation_id,
            matashita: matashita,
          }
        }
      }
      // 値の登録
      await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${registitem.customer_uid}/cartitems/${registitem.cartitem_id}`)
      .set(
        registitem,
        {merge: false}
      )
      .catch((error) => {
        throw error;
      })
      return registitem;
    }
    else{
      throw new Error("error/variation-is-not-exist: " + variation_id);
    }
  }

  async getitem(variation_id: string):Promise<AnsCartItem | null>{
    const items: any[] = [];
    await lastValueFrom(this.afstore.collection(`/tailormeasure/${this._office}/items`).get())
    .then((snapshot) => {
      if(!snapshot.empty){
        for(const i in snapshot.docs){
          const doc = snapshot.docs[i];
          let variations = doc.get("variations");
          for(const j in variations){
            variations[j].candisplay = variations[j].candisplay ? variations[j].candisplay : "visible";
          }
          items.push({
            item_id: doc.get("item_id"),
            item_name: doc.get("item_name"),
            item_category_id: doc.get("item_category_id"),
            item_color: doc.get("item_color"),
            item_background_color: doc.get("item_background_color"),
            item_index: doc.get("item_index"),
            variations: variations,
            showmeasuring: doc.get("showmeasuring"),
            diffsizing: doc.get("diffsizing") ? doc.get("diffsizing") : false,
            shops: doc.get("shops") ? doc.get("shops") : [],
            genders: doc.get("genders") ? doc.get("genders") : [],
            cartplate: doc.get("cartplate") ? doc.get("cartplate") : null,
            created_at: doc.get("created_at"),
          });
        }
      }
    })
    .catch((error: Error) => {
      throw error;
    });
    for(const i in items){
      for(const j in items[i].variations){
        if(items[i].variations[j].variation_id == variation_id){
          return {
            item_id: items[i].variations[j].item_id,
            // plate_id: items[i].cartplate.plate_id,
            plate_id: items[i].cartplate ? items[i].cartplate.plate_id : null,
            variation: {
              price: items[i].variations[j].price,
              sku: items[i].variations[j].sku,
              variation_id: items[i].variations[j].variation_id,
              matashita: items[i].variations[j].matashita ? items[i].variations[j].matashita : null,
            }
          }
        }
      }
    }
    return null;
  }

  async deletecustomercartitem(customer_uid: string, variation_id: string):Promise<boolean>{
    const customercartitem = await this.getsamevariation(customer_uid,variation_id);
    if(customercartitem){
      await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customercartitem.customer_uid}/cartitems/${customercartitem.cartitem_id}`).delete()
      .catch((error) => {
        throw error;
      });
      return true;
    }
    else{
      return false;
    }
  }

  async getsamevariation(customer_uid: string, variation_id: string):Promise<CustomerCartItem  | null>{
    let result = null;
    await lastValueFrom(this.afstore.collection(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems`).get())
    .then((snapshot) => {
      if(!snapshot.empty){
        for(const i in snapshot.docs){
          const doc = snapshot.docs[i];
          const variation = doc.get("variation");
          if (variation.variation_id==variation_id){
            result = {
              amount: doc.get("amount"),
              cartitem_id: doc.get("cartitem_id"),
              customer_uid: doc.get("customer_uid"),
              item_id: doc.get("item_id"),
              plate_id: doc.get("plate_id"),
              variation: {
                price: variation.price,
                sku: variation.sku,
                variation_id: variation.variation_id,
                matashita: variation.matashita ? variation.matashita : null,
              }
            };
          }
        }
      }
    });
    return result;
  }


  getcustomercartinfo(customer_uid: string): Observable<CustomerCartInfo>{
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).get()
    .pipe(
      map((doc) => {
        let result = {
          matashita: 0,
          skirttake: 0,
          ext01_name: null,
          ext01_length: 0,
          ext02_name: null,
          ext02_length: 0,
          remark: null,
          remark2: null,
          includepostage: false,
        }
        if(doc.exists){
          result = {
            matashita: doc.get("matashita") ? doc.get("matashita") : 0,
            skirttake: doc.get("skirttake") ? doc.get("skirttake") : 0,
            ext01_name: doc.get("ext01_name") ? doc.get("ext01_name") : null,
            ext01_length: doc.get("ext01_length") ? doc.get("ext01_length") : 0,
            ext02_name: doc.get("ext02_name") ? doc.get("ext02_name") : null,
            ext02_length: doc.get("ext02_length") ? doc.get("ext02_length") : 0,
            remark: doc.get("remark") ? doc.get("remark") : null,
            remark2: doc.get("remark2") ? doc.get("remark2") : null,
            includepostage: doc.get("includepostage") ? doc.get("includepostage") : false,
          }
        }
        return result;
      })
    );
  }

  async setcustomercartinfo(customer_uid: string,customercartinfo: CustomerCartInfo): Promise<CustomerCartInfo>{
    return await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).set({
      matashita: customercartinfo.matashita,
      skirttake: customercartinfo.skirttake,
      ext01_name: customercartinfo.ext01_name,
      ext01_length: customercartinfo.ext01_length,
      ext02_name: customercartinfo.ext02_name,
      ext02_length: customercartinfo.ext02_length,
      remark: customercartinfo.remark,
      remark2: customercartinfo.remark2,
      includepostage: customercartinfo.includepostage,
    },{merge: true})
    .then(() => {
      return customercartinfo;
    })
    .catch((error: Error) => {
      throw error;
    });
  }

  async ischecked(customer_uid: string): Promise<boolean>{
    let result = false;
    await lastValueFrom(this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).get())
    .then((data) => {
      if(data.exists){
        const total_money = data.get("total_money") ? data.get("total_money") : 0;
        const payment_method = data.get("payment_method") ? data.get("payment_method") : null;

        if((total_money > 0)&&((payment_method=="CASH")||(payment_method=="OTHER"))){
          result = true;
        }
      }
    })
    .catch((error: Error) => {
      throw error;
    });
    return result;
  }
}
