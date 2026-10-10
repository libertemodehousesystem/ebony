import { Injectable } from '@angular/core';

import { lastValueFrom, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { FirestoreService } from '../lib/firestore.service';

export interface Customer {
  customer_uid: string;
  qr_code_id: string | null;
  customer_family_kn_name: string;
  customer_given_kn_name: string;
  customer_family_name: string;
  customer_given_name: string;
  customer_parent_family_kn_name?: string;
  customer_parent_given_kn_name?: string;
  customer_parent_family_name?: string;
  customer_parent_given_name?: string;
  email: string;
  phone: string;
  zip_code: string;
  addrstate: string;
  addr1: string;
  addr2: string;
  addr3: string;
  gender_id: number;
  shop_id: string;
  reference_id: string;
  square_customer_uid: string;
}

export function emptyCustomer(): Customer {
  return {
    customer_uid: null,
    qr_code_id: null,
    customer_family_kn_name: '',
    customer_given_kn_name: '',
    customer_family_name: '',
    customer_given_name: '',
    customer_parent_family_kn_name: '',
    customer_parent_given_kn_name: '',
    customer_parent_family_name: '',
    customer_parent_given_name: '',
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
  };
}

export function copyCustomer(customer: Customer): Customer {
  return { ...emptyCustomer(), ...customer };
}

export interface Shop {
  shop_id: string;
  shop_name: string;
  deliveryshopheader: string;
  created_at: string;
}

export interface OriginalCategory {
  category_id: string;
  category_name: string;
  is_daleted: boolean;
  linked_at: string;
  present_at_all_locations: boolean;
  updated_at: string;
}

export interface ItemCategory {
  category_id: string;
  category_index: number;
  category_name: string;
  category_subname: string;
  category_color: string;
  category_background_color: string;
  created_at: string;
}

export interface Item {
  item_id: string;
  item_name: string;
  item_category_id: string;
  item_category_subname?: string;
  item_color: string;
  item_background_color: string;
  item_index?: number;
  variations: any[];
  showmeasuring: boolean;
  diffsizing: boolean;
  pickupitem: boolean;
  postage_id: number;
  shops: Shop[];
  genders: any[];
  cartplate: any;
  created_at: string;
}

export interface ItemAndCategory {
  category_id: string;
  category_index: number;
  category_name: string;
  category_color: string;
  category_background_color: string;
  items: Item[];
  created_at: string;
}

export interface CartItem {
  cartitem_id: string;
  item_id: string;
  item_name: string;
  item_category_id: string;
  item_category_subname?: string;
  item_color: string;
  item_background_color: string;
  item_index?: number;
  variations: any[];
  showmeasuring: boolean;
  diffsizing: boolean;
  shops: Shop[];
  genders: any[];
  cartplate: any;
  created_at: string;
}

export interface ExtraCustomer {
  customer_uid: string;
  qr_code_id: string | null;
  customer_family_kn_name: string;
  customer_given_kn_name: string;
  customer_family_name: string;
  customer_given_name: string;
  customer_parent_family_kn_name?: string;
  customer_parent_given_kn_name?: string;
  customer_parent_family_name?: string;
  customer_parent_given_name?: string;
  email: string;
  phone: string;
  zip_code: string;
  addrstate: string;
  addr1: string;
  addr2: string;
  addr3: string;
  gender_id: number;
  gender_name?: string;
  shop_id: string;
  shop_name?: string;
  reference_id: string;
  square_customer_uid: string | null;
  square_order_id: string | null;
  square_payment_id: string | null;
  payment_method: string | null;
  receive_money: number;
  change_money: number;
  total_money: number;
  earned_at: string | null;
  earned_at_ymd?: string;
}

export interface CashApplyWith {
  apply_id: string;
  excluded_at: string | null;
  freee_company_id: number;
  freee_wallettxn_id: number;
  square_event_id: string | null;
  square_location_id: string;
  square_order_created_at: string;
  square_order_id: string;
  wallettxn: FreeWallettxn;
}

export interface FreeWallettxn {
  amount: number;
  balance: number;
  company_display_name: string;
  company_id: number;
  company_name: string | null;
  company_name_kana: string | null;
  date: string;
  description: string;
  due_amount: number;
  entry_side: string;
  status: number;
  walletable_id: number;
  walletable_name: string;
  walletable_type: string;
  wallettxn_id: number;
}


interface MoveAddCustomer {
  id: string;
  family_name: string;
  given_name: string;
  email_address: string;
  phone_number: string;
  address: {
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    country: string;
    postal_code: string;
  }
  version: number;
}

@Injectable({
  providedIn: 'root'
})
export class StoreaccessService {

  private _office = "SHITATEKAN";
  private _genders = [
    {gender_id: 1,caption: "男性"},
    {gender_id: 2,caption: "女性"},
  ];

  private _postages = [
    {postage_id: 0, caption: "対象外", bg_color: "#ffffff", font_color: "#000000"},
    {postage_id: 1, caption: "冬物送料", bg_color: "#f5deb3", font_color: "#000000"},
    {postage_id: 2, caption: "夏物送料", bg_color: "#4169e1", font_color: "#ffffff"},
  ]

  stockcategories:ItemCategory[] = [];

  customerSubject:Subject<any> = new Subject();
  customerState = this.customerSubject.asObservable();

  constructor(
    private afstore: FirestoreService,
  ) { }

  get genders(){
    return this._genders;
  }

  get office(){
    return this._office;
  }

  get postages() {
    return this._postages;
  }

  sendcustomerchange(customer){
    this.customerSubject.next(customer);
  }

  getaccessinformation(){
    return this.afstore.doc(`/tailormeasure/access`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            basepath: doc.get("basepath"),
            access_token: doc.get("access_token"),
            client_id: doc.get("client_id"),
            client_secret: doc.get("client_secret"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  gettokeninformation(){
    return this.afstore.doc(`/tailormeasure/${this._office}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            access_token: doc.get("access_token"),
            expires_at: doc.get("expires_at"),
            merchant_id: doc.get("merchant_id"),
            refresh_token: doc.get("refresh_token"),
            short_lived: doc.get("short_lived"),
            token_type: doc.get("token_type"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  getsquarelocations(){
    return this.afstore.collection(`/tailormeasure/${this._office}/squarelocations`).get().pipe(
      map((snapshot) => {
        const resutls = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            resutls.push(doc.data());
          }
        }
        return resutls;
      })
    )
  }

  async setlocation(location){
    return await this.afstore.doc(`/tailormeasure/${this._office}`)
    .set({
      location_id: location.location_id,
      location_name: location.location_name,
    },{merge: true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  getlocation(){
    return this.afstore.doc(`/tailormeasure/${this._office}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            location_id: doc.get("location_id"),
            location_name: doc.get("location_name"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  getshops(){
    return this.afstore.collection(`/tailormeasure/${this._office}/shops`).get().pipe(
      map((shopsnap) => {
        const results = [];
        if(!shopsnap.empty){
          for(const i in shopsnap.docs){
            const doc = shopsnap.docs[i];
            results.push({
              shop_id: doc.get("shop_id"),
              shop_name: doc.get("shop_name"),
              deliveryshopheader: doc.get("deliveryshopheader") ? doc.get("deliveryshopheader") : "",
              created_at: doc.get("created_at"),
            })
          }
        }
        return results;
      })
    )
  }

  async setshop(shop){
    if(!shop.shop_id){
      shop.shop_id = this.afstore.createId();
    }
    return await this.afstore.doc(`/tailormeasure/${this._office}/shops/${shop.shop_id}`)
    .set({
      shop_id: shop.shop_id,
      shop_name: shop.shop_name,
      deliveryshopheader: shop.deliveryshopheader ? shop.deliveryshopheader : "",
      created_at: new Date().toISOString(),
    },{merge: true})
    .then(() => {
      return shop;
    })
    .catch((error) => {
      throw error;
    })
  }

  getlinkagecustomers(){
    return this.afstore.collection(`/tailormeasure/linkages/customers`).get().pipe(
      map((cussnap) => {
        const results = [];
        if(!cussnap.empty){
          for(const i in cussnap.docs){
            const doc = cussnap.docs[i];
            results.push({
              customer_id: doc.get("customer_id"),
              given_name: doc.get("given_name"),
              family_name: doc.get("family_name"),
              address: doc.get("address"),
              zip_code: doc.get("zip_code"),
              phone: doc.get("phone"),
              reference_id: doc.get("reference_id"),
              created_at: doc.get("created_at"),
              updated_at: doc.get("updated_at"),
            })
          }
        }
        return results;
      })
    )
  }

  gettailorcustomers(){
    return this.afstore.collection(`/tailormeasure/${this._office}/customers`).get().pipe(
      map((snapshot) => {
        const resutls = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            resutls.push({
              customer_uid: doc.get("customer_uid"),
              qr_code_id: doc.get("qr_code_id") ? doc.get("qr_code_id") : null,
              customer_family_kn_name: doc.get("customer_family_kn_name"),
              customer_given_kn_name: doc.get("customer_given_kn_name"),
              customer_family_name: doc.get("customer_family_name"),
              customer_given_name: doc.get("customer_given_name"),
              customer_parent_family_kn_name: doc.get("customer_parent_family_kn_name"),
              customer_parent_given_kn_name: doc.get("customer_parent_given_kn_name"),
              customer_parent_family_name: doc.get("customer_parent_family_name"),
              customer_parent_given_name: doc.get("customer_parent_given_name"),
              email: doc.get("email"),
              phone: doc.get("phone"),
              zip_code: doc.get("zip_code"),
              addrstate: doc.get("addrstate"),
              addr1: doc.get("addr1"),
              addr2: doc.get("addr2"),
              addr3: doc.get("addr3"),
              gender_id: doc.get("gender_id"),
              shop_id: doc.get("shop_id"),
              reference_id: doc.get("reference_id"),
              square_customer_uid: doc.get("square_customer_uid") ? doc.get("square_customer_uid") : null,
            });
          }
        }
        resutls.sort((a,b) => {
          if(a.customer_kn_name > b.customer_kn_name) return 1;
          if(a.customer_kn_name < b.customer_kn_name) return -1;
          return 0;
        })
        return resutls;
      })
    )
  }

  gettailorcustomer(customer_uid){
    return this.afstore.doc(`/tailormeasure/${this._office}/customers/${customer_uid}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            customer_uid: doc.get("customer_uid"),
            qr_code_id: doc.get("qr_code_id") ? doc.get("qr_code_id") : null,
            customer_family_kn_name: doc.get("customer_family_kn_name"),
            customer_given_kn_name: doc.get("customer_given_kn_name"),
            customer_family_name: doc.get("customer_family_name"),
            customer_given_name: doc.get("customer_given_name"),
            customer_parent_family_kn_name: doc.get("customer_parent_family_kn_name"),
            customer_parent_given_kn_name: doc.get("customer_parent_given_kn_name"),
            customer_parent_family_name: doc.get("customer_parent_family_name"),
            customer_parent_given_name: doc.get("customer_parent_given_name"),
            email: doc.get("email"),
            phone: doc.get("phone"),
            zip_code: doc.get("zip_code"),
            addrstate: doc.get("addrstate"),
            addr1: doc.get("addr1"),
            addr2: doc.get("addr2"),
            addr3: doc.get("addr3"),
            gender_id: doc.get("gender_id"),
            shop_id: doc.get("shop_id"),
            reference_id: doc.get("reference_id"),
            square_customer_uid: doc.get("square_customer_uid") ? doc.get("square_customer_uid") : null,
          }
        }
        else{
          return null;
        }
      })
    )
  }

  getcustomerbyqrcodeid(qr_code_id: string){
    return this.afstore.collection(`/tailormeasure/${this._office}/customers`,ref => ref.where("qr_code_id", "==", qr_code_id)).get().pipe(
      map((qrysnapshot) => {
        if(!qrysnapshot.empty){
          const qrydoc = qrysnapshot.docs[0];
          return {
            customer_uid: qrydoc.get("customer_uid"),
            qr_code_id: qrydoc.get("qr_code_id") ? qrydoc.get("qr_code_id") : null,
            customer_family_kn_name: qrydoc.get("customer_family_kn_name"),
            customer_given_kn_name: qrydoc.get("customer_given_kn_name"),
            customer_family_name: qrydoc.get("customer_family_name"),
            customer_given_name: qrydoc.get("customer_given_name"),
            customer_parent_family_kn_name: qrydoc.get("customer_parent_family_kn_name"),
            customer_parent_given_kn_name: qrydoc.get("customer_parent_given_kn_name"),
            customer_parent_family_name: qrydoc.get("customer_parent_family_name"),
            customer_parent_given_name: qrydoc.get("customer_parent_given_name"),
            email: qrydoc.get("email"),
            phone: qrydoc.get("phone"),
            zip_code: qrydoc.get("zip_code"),
            addrstate: qrydoc.get("addrstate"),
            addr1: qrydoc.get("addr1"),
            addr2: qrydoc.get("addr2"),
            addr3: qrydoc.get("addr3"),
            gender_id: qrydoc.get("gender_id"),
            shop_id: qrydoc.get("shop_id"),
            reference_id: qrydoc.get("reference_id"),
            square_customer_uid: qrydoc.get("square_customer_uid") ? qrydoc.get("square_customer_uid") : null,
          }
        }
        else{
          return null;
        }
      })
    )
  }

  async settailorcustomer(customerinfo:Customer){
    if(!customerinfo.customer_uid){
      customerinfo.customer_uid = this.afstore.createId();
    }
    if(!customerinfo.qr_code_id){
      customerinfo.qr_code_id = this.afstore.createId();
    }
    return await this.afstore.doc(`/tailormeasure/${this._office}/customers/${customerinfo.customer_uid}`)
    .set({
      customer_uid: customerinfo.customer_uid,
      qr_code_id: customerinfo.qr_code_id,
      customer_family_kn_name: customerinfo.customer_family_kn_name,
      customer_given_kn_name: customerinfo.customer_given_kn_name,
      customer_family_name: customerinfo.customer_family_name,
      customer_given_name: customerinfo.customer_given_name,
      customer_parent_family_kn_name: customerinfo.customer_parent_family_kn_name,
      customer_parent_given_kn_name: customerinfo.customer_parent_given_kn_name,
      customer_parent_family_name: customerinfo.customer_parent_family_name,
      customer_parent_given_name: customerinfo.customer_parent_given_name,
      email: customerinfo.email,
      phone: customerinfo.phone,
      zip_code: customerinfo.zip_code,
      addrstate: customerinfo.addrstate,
      addr1: customerinfo.addr1,
      addr2: customerinfo.addr2,
      addr3: customerinfo.addr3,
      gender_id: customerinfo.gender_id,
      shop_id: customerinfo.shop_id,
      reference_id: customerinfo.customer_uid ? customerinfo.customer_uid : null,
      square_customer_uid: customerinfo.square_customer_uid ? customerinfo.square_customer_uid : null,
    },{merge: true})
    .then(() => {
      return customerinfo;
    })
    .catch((error) => {
      throw error;
    })
  }

  async deletetailorcustomer(customer_uid:string){
    return await this.afstore.doc(`/tailormeasure/${this._office}/customers/${customer_uid}`).delete()
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  async updateregistedtailorcustomer(customer_uid:string,square_customer_uid:string){
    return await this.afstore.doc(`/tailormeasure/${this._office}/customers/${customer_uid}`)
    .set({
      square_customer_uid: square_customer_uid,
    },{merge: true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  suggestcustomer(customer_family_name: string){
    return this.afstore.collection(`/tailormeasure/${this._office}/customers`).get().pipe(
      map((customersnap) => {
        const results = [];
        if(!customersnap.empty){
          for(const i in customersnap.docs){
            const customer = customersnap.docs[i];
            if(customer.get("customer_family_name").indexOf(customer_family_name) >= 0){
              results.push({
                customer_uid: customer.get("customer_uid"),
                qr_code_id: customer.get("qr_code_id"),
                customer_family_kn_name: customer.get("customer_family_kn_name"),
                customer_given_kn_name: customer.get("customer_given_kn_name"),
                customer_family_name: customer.get("customer_family_name"),
                customer_given_name: customer.get("customer_given_name"),
                customer_parent_family_kn_name: customer.get("customer_parent_family_kn_name"),
                customer_parent_given_kn_name: customer.get("customer_parent_given_kn_name"),
                customer_parent_family_name: customer.get("customer_parent_family_name"),
                customer_parent_given_name: customer.get("customer_parent_given_name"),
                email: customer.get("email"),
                phone: customer.get("phone"),
                zip_code: customer.get("zip_code"),
                addrstate: customer.get("addrstate"),
                addr1: customer.get("addr1"),
                addr2: customer.get("addr2"),
                addr3: customer.get("addr3"),
                gender_id: customer.get("gender_id"),
                shop_id: customer.get("shop_id"),
                reference_id: customer.get("reference_id"),
                square_registed: customer.get("square_registed") ? customer.get("square_registed") : false,
                square_customer_uid: customer.get("square_customer_uid") ? customer.get("square_customer_uid") : null,
              })
            }
          }
        }
        return results;
      })
    );
  }

  gettailoritemcategories():Observable<ItemCategory[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/itemcategories`,ref => ref.orderBy("category_index","asc")).get().pipe(
      map ((snapshot) => {
        const results = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            results.push({
              category_id: doc.get("category_id"),
              category_index: doc.get("category_index"),
              category_name: doc.get("category_name"),
              category_subname: doc.get("category_subname"),
              category_color: doc.get("category_color"),
              category_background_color: doc.get("category_background_color"),
              created_at: doc.get("created_at"),
            });
          }
        }
        return results;
      })
    )
  }

  gettailoritemcategory(category_id):Observable<ItemCategory>{
    return this.afstore.doc(`/tailormeasure/${this._office}/itemcategories/${category_id}`).get().pipe(
      map ((doc) => {
        if(doc.exists){
          return {
            category_id: doc.get("category_id"),
            category_index: doc.get("category_index"),
            category_name: doc.get("category_name"),
            category_subname: doc.get("category_subname"),
            category_color: doc.get("category_color"),
            category_background_color: doc.get("category_background_color"),
            created_at: doc.get("created_at"),
          };
        }
        else{
          return null;
        }
      })
    )
  }

  async settailoritemcategory(category:ItemCategory){
    if(!category.category_id){
      category.category_id = this.afstore.createId();
    }
    return await Promise.resolve()
    .then(() => {
      return this.afstore.collection(`/tailormeasure/${this._office}/itemcategories`,ref => ref.orderBy("category_index","desc").limit(1)).get().toPromise();
    })
    .then((indexsnap) => {
      if(!indexsnap.empty){
        category.category_index = indexsnap.docs[0].get("category_index")+1;
      }
      else{
        category.category_index = 1;
      }
      return this.afstore.doc(`/tailormeasure/${this._office}/itemcategories/${category.category_id}`)
      .set({
        category_id: category.category_id,
        category_index: category.category_index,
        category_name: category.category_name,
        category_subname: category.category_subname,
        category_color: category.category_color,
        category_background_color: category.category_background_color,
        created_at: new Date().toISOString(),
      },{merge: true})
    })
    .then(() => {
      return category;
    })
    .catch((error) => {
      throw error;
    })
  }

  async updatetailoritemcategory(category:ItemCategory){
    console.log("update: ",category);
    return await this.afstore.doc(`/tailormeasure/${this._office}/itemcategories/${category.category_id}`)
    .set({
      category_id: category.category_id,
      category_index: category.category_index,
      category_name: category.category_name,
      category_subname: category.category_subname,
      category_color: category.category_color,
      category_background_color: category.category_background_color,
      created_at: new Date().toISOString(),
    },{merge: true})
    .then(() => {
      return category;
    })
    .catch((error) => {
      throw error;
    })
  }

  getoriginalcategories():Observable<OriginalCategory[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/squarecategories`).get().pipe(
      map ((cateshot) => {
        const results = [];
        if(!cateshot.empty){
          for(const i in cateshot.docs){
            const doc = cateshot.docs[i];
            results.push({
              category_id: doc.get("category_id"),
              category_name: doc.get("category_name"),
              is_daleted: doc.get("is_daleted"),
              linked_at: doc.get("linked_at"),
              present_at_all_locations: doc.get("present_at_all_locations"),
              updated_at: doc.get("updated_at"),
            })
          }
        }
        return results;
      })
    )
  }

  getitems():Observable<Item[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/items`).get().pipe(
      map((itemshop) => {
        const results = [];
        if(!itemshop.empty){
          for(const i in itemshop.docs){
            const doc = itemshop.docs[i];
            let variations = doc.get("variations");
            for(const j in variations){
              variations[j].candisplay = variations[j].candisplay ? variations[j].candisplay : "visible";
            }
            results.push({
              item_id: doc.get("item_id"),
              item_name: doc.get("item_name"),
              item_category_id: doc.get("item_category_id"),
              item_color: doc.get("item_color"),
              item_background_color: doc.get("item_background_color"),
              item_index: doc.get("item_index"),
              variations: variations,
              showmeasuring: doc.get("showmeasuring"),
              diffsizing: doc.get("diffsizing") ? doc.get("diffsizing") : false,
              pickupitem: doc.get("pickupitem") ? doc.get("pickupitem") : false,
              postage_id: doc.get("postage_id") ? doc.get("postage_id") : 0,
              shops: doc.get("shops") ? doc.get("shops") : [],
              genders: doc.get("genders") ? doc.get("genders") : [],
              cartplate: doc.get("cartplate") ? doc.get("cartplate") : null,
              created_at: doc.get("created_at"),
            });
          }
          results.sort((a,b) => {
            if((!a.cartplate)&&(b.cartplate)) return 1;
            if(!b.cartplate) return -1;
            if(a.cartplate.ordinal > b.cartplate.ordinal) return 1;
            if(a.cartplate.ordinal < b.cartplate.ordinal) return -1;
            if(a.item_index > b.item_index) return 1;
            if(a.item_index < b.item_index) return -1;
            return 0;
          })
        }
        return results;
      })
    );
  }

  getmeasuringitems(value):Observable<Item[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/items`,ref => ref.where("showmeasuring","==",value)).get().pipe(
      map((itemmeasuring) => {
        const results = [];
        if(!itemmeasuring.empty){
          for(const i in itemmeasuring.docs){
            const doc = itemmeasuring.docs[i];
            let variations = doc.get("variations");
            for(const j in variations){
              variations[j].candisplay = variations[j].candisplay ? variations[j].candisplay : "visible";
            }
            results.push({
              item_id: doc.get("item_id"),
              item_name: doc.get("item_name"),
              item_category_id: doc.get("item_category_id"),
              item_color: doc.get("item_color"),
              item_background_color: doc.get("item_background_color"),
              item_index: doc.get("item_index"),
              variations: variations,
              showmeasuring: doc.get("showmeasuring"),
              diffsizing: doc.get("diffsizing") ? doc.get("diffsizing") : false,
              pickupitem: doc.get("pickupitem") ? doc.get("pickupitem") : false,
              postage_id: doc.get("postage_id") ? doc.get("postage_id") : 0,
              shops: doc.get("shops") ? doc.get("shops") : [],
              genders: doc.get("genders") ? doc.get("genders") : [],
              cartplate: doc.get("cartplate") ? doc.get("cartplate") : null,
              created_at: doc.get("created_at"),
            });
          }
          results.sort((a,b) => {
            if((!a.cartplate)&&(b.cartplate)) return 1;
            if(!b.cartplate) return -1;
            if(a.cartplate.ordinal > b.cartplate.ordinal) return 1;
            if(a.cartplate.ordinal < b.cartplate.ordinal) return -1;
            if(a.item_index > b.item_index) return 1;
            if(a.item_index < b.item_index) return -1;
            return 0;
          })
        }
        return results;
      })
    );
  }

  async setitem(item:Item){
    if(!item.item_id){
      item.item_id = this.afstore.createId();
    }
    return await this.afstore.doc(`/tailormeasure/${this._office}/items/${item.item_id}`)
    .set({
      item_id: item.item_id,
      item_name: item.item_name,
      item_category_id: item.item_category_id,
      item_color: item.item_color,
      item_background_color: item.item_background_color,
      item_index: item.item_index,
      variations: item.variations,
      showmeasuring: item.showmeasuring,
      diffsizing: item.diffsizing,
      pickupitem: item.pickupitem,
      postage_id: item.postage_id,
      shops: item.shops,
      genders: item.genders,
      cartplate: item.cartplate,
      created_at: new Date().toISOString(),
    },{merge: true})
    .then(() => {
      return item;
    })
    .catch((error) => {
      throw error;
    });
  }

  async setitemname(item: Item){
    if(!item.item_id){
      throw new Error("item-id-is-null");
    }
    return await this.afstore.doc(`/tailormeasure/${this._office}/items/${item.item_id}`)
    .set({
      item_name: item.item_name,
    },{merge: true})
    .then(() => {
      return item;
    })
    .catch((error) => {
      throw error;
    });
  }

  async deleteitem(item:Item){
    return await this.afstore.doc(`/tailormeasure/${this._office}/items/${item.item_id}`)
    .delete()
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    });
  }

  getoriginalitems():Observable<any[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/squareitems`).get().pipe(
      map((itemshop) => {
        const results = [];
        if(!itemshop.empty){
          for(const i in itemshop.docs){
            const doc = itemshop.docs[i];
            results.push({
              item_id: doc.get("item_id"),
              item_name: doc.get("item_name"),
              category_id: doc.get("category_id"),
              label_color: doc.get("label_color"),
              description: doc.get("description"),
              is_deleted: doc.get("is_deleted"),
              present_at_all_locations: doc.get("present_at_all_locations"),
              present_at_location_ids: doc.get("present_at_location_ids"),
              updated_at: doc.get("updated_at"),
              linked_at: doc.get("linked_at"),
            });
          }
        }
        return results;
      })
    );
  }


  getoriginalvariation(item_id):Observable<any[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/squarevariations`,ref => ref.where("item_id","==",item_id)).get().pipe(
      map((itemshop) => {
        const results = [];
        if(!itemshop.empty){
          for(const i in itemshop.docs){
            const doc = itemshop.docs[i];
            results.push({
              variation_id: doc.get("variation_id"),
              variation_name: doc.get("variation_name"),
              item_id: doc.get("item_id"),
              sku: doc.get("sku"),
              ordinal: doc.get("ordinal"),
              price: doc.get("price"),
              is_deleted: doc.get("is_deleted"),
              present_at_all_locations: doc.get("present_at_all_locations"),
              present_at_location_ids: doc.get("present_at_location_ids"),
              updated_at: doc.get("updated_at"),
              linked_at: doc.get("linked_at"),
            });
          }
        }
        // 並び替え
        results.sort((a,b) => {
          if(a.ordinal > b.ordinal) return 1;
          if(a.ordinal < b.ordinal) return -1;
          return 0;
        })
        return results;
      })
    );
  }

  getcartplates(){
    return this.afstore.collection(`/tailormeasure/${this._office}/cartplates`).get().pipe(
      map((plateshot) => {
        const results = [];
        if(!plateshot.empty){
          for(const i in plateshot.docs){
            const doc = plateshot.docs[i];
            results.push({
              plate_id: doc.get("plate_id"),
              caption: doc.get("caption"),
              ordinal: doc.get("ordinal"),
              genders: doc.get("genders"),
              displayqrcode: doc.get("displayqrcode") ? doc.get("displayqrcode") : false,
            })
          }
        }
        results.sort((a,b) => {
          if(a.ordinal > b.ordinal) return 1;
          if(a.ordinal < b.ordinal) return -1;
          return 0;
        })
        return results;
      })
    )
  }

  setcartplate(cartplate){
    if(!cartplate.plate_id){
      cartplate.plate_id = this.afstore.createId();
    }
    return this.afstore.doc(`/tailormeasure/${this._office}/cartplates/${cartplate.plate_id}`)
    .set({
      plate_id: cartplate.plate_id,
      caption: cartplate.caption,
      ordinal: cartplate.ordinal,
      genders: cartplate.genders,
      displayqrcode: cartplate.displayqrcode,
    },{merge: true})
    .then(() => {
      //
    })
    .catch((error) => {
      throw error;
    })
  }

  getcartmeasurement(customer_uid){
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            matashita: doc.get("matashita"),
            skirttake: doc.get("skirttake"),
            ext01_name: doc.get("ext01_name") ? doc.get("ext01_name") : "",
            ext01_length: doc.get("ext01_length") ? doc.get("ext01_length") : 0,
            ext02_name: doc.get("ext02_name") ? doc.get("ext02_name") : "",
            ext02_length: doc.get("ext02_length") ? doc.get("ext02_length") : 0,
            remark: doc.get("remark") ? doc.get("remark") : "",
            remark2: doc.get("remark2") ? doc.get("remark2") : "",
            includepostage: doc.get("includepostage") == undefined ? null : doc.get("includepostage"),
            includepostage2: doc.get("includepostage2") == undefined ? null : doc.get("includepostage2"),
          }
        }
        return {
          matashita: 0,
          momomawari: 0,
          skirttake: 0,
          ext01_name: "",
          ext01_length: 0,
          ext02_name: "",
          ext02_length: 0,
          remark: "",
          remark2: "",
          includepostage: null,
          includepostage2: null,
        };
      })
    );
  }

  getscartmeasurement(){
    return this.afstore.collection(`/tailormeasure/${this._office}/customercarts`).get().pipe(
      map((snapshot) => {
        const results: any[]  = [];
        if(!snapshot.empty){
          snapshot.docs.forEach((doc) => {
            results.push({
              customer_uid: doc.id,
              matashita: doc.get("matashita"),
              skirttake: doc.get("skirttake"),
              ext01_name: doc.get("ext01_name") ? doc.get("ext01_name") : "",
              ext01_length: doc.get("ext01_length") ? doc.get("ext01_length") : 0,
              ext02_name: doc.get("ext02_name") ? doc.get("ext02_name") : "",
              ext02_length: doc.get("ext02_length") ? doc.get("ext02_length") : 0,
              remark: doc.get("remark") ? doc.get("remark") : "",
              remark2: doc.get("remark2") ? doc.get("remark2") : "",
              includepostage: doc.get("includepostage") == undefined ? null : doc.get("includepostage"),
              includepostage2: doc.get("includepostage2") == undefined ? null : doc.get("includepostage2"),
            });
          });
        }
        return results;
      })
    );
  }

  async setcartmeasurement(customer_uid,measurement){
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`)
    .set({
      matashita: measurement.matashita,
      skirttake: measurement.skirttake,
      ext01_name: measurement.ext01_name,
      ext01_length: measurement.ext01_length,
      ext02_name: measurement.ext02_name,
      ext02_length: measurement.ext02_length,
      remark: measurement.remark,
      remark2: measurement.remark2,
      includepostage: measurement.includepostage,
      includepostage2: measurement.includepostage2,
    },{merge: true})
    .then(() => {
      return measurement;
    })
    .catch((error) => {
      throw error;
    })
  }

  getcheckcomment(customer_uid){
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            olduse: doc.get("olduse") ? doc.get("olduse") : false,
            receipt_mode: doc.get("receipt_mode") ? doc.get("receipt_mode") : false,
            receipt_address: doc.get("receipt_address") ? doc.get("receipt_address") : null,
            receipt_proviso: doc.get("receipt_proviso") ? doc.get("receipt_proviso") : null,
          }
        }
        return {
          olduse: false,
          receipt_mode: false,
          receipt_addr: null,
          receipt_proviso: null,
      };
      })
    );
  }

  async setcheckcomment(customer_uid, checkcomment){
    return await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`)
    .set({
      olduse: checkcomment.olduse,
      receipt_mode: checkcomment.receipt_mode,
      receipt_address: checkcomment.receipt_address,
      receipt_proviso: checkcomment.receipt_proviso,
    },{merge: true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    });
  }

  getcartitems(customer_uid){
    return this.afstore.collection(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems`).get().pipe(
      map((snapshot) => {
        const results = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            results.push(doc.data())
          }
        }
        return results;
      })
    )
  }

  async alldeletecartitem(customer_uid){
    return await Promise.resolve()
    .then(() => {
      return this.afstore.collection(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems`).get().toPromise();
    })
    .then(async (snapshot) => {
      if(!snapshot.empty){
        for(const i in snapshot.docs){
          const cartitem_id = snapshot.docs[i].get("cartitem_id");
          await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems/${cartitem_id}`).delete();
        }
      }
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  async allmeasuringdeletecartitem(customer_uid){
    return await Promise.resolve()
    .then(() => {
      return this.afstore.collection(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems`).get().toPromise();
    })
    .then(async (snapshot) => {
      let delitemcount = 0;
      if(!snapshot.empty){
        for(const i in snapshot.docs){
          const item_id = snapshot.docs[i].get("item_id");
          await this.afstore.doc(`/tailormeasure/${this._office}/items/${item_id}`).get().toPromise()
          .then(async (itemdoc) => {
            if(itemdoc){
              const candelete = itemdoc.get("showmeasuring") ? itemdoc.get("showmeasuring") : false;
              if(candelete){
                delitemcount++;
                const cartitem_id = snapshot.docs[i].get("cartitem_id");
                await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems/${cartitem_id}`).delete();
              }
            }
          })
        }
      }
      console.log("del item count:", delitemcount);
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  async deletecartitem(customer_uid, cartitem_id){
    return await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems/${cartitem_id}`).delete()
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  async setcartitem(customer_uid,cartitem){
    if(!cartitem.cartitem_id){
      cartitem.cartitem_id = this.afstore.createId();
    }
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems/${cartitem.cartitem_id}`)
    .set({
      customer_uid: customer_uid,
      cartitem_id: cartitem.cartitem_id,
      plate_id: cartitem.plate_id,
      item_id: cartitem.item_id,
      amount: cartitem.amount,
      variation: cartitem.variation,
    },{merge: true})
    .then(() => {
      return cartitem;
    })
    .catch((error) => {
      throw error;
    })
  }

  async setcartitemamout(customer_uid,cartitem_id,amount){
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}/cartitems/${cartitem_id}`)
    .set({
      amount: amount,
    },{merge: true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  getcartorder(customer_uid){
    return this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            square_order_id: doc.get("square_order_id") ? doc.get("square_order_id") : null,
            square_payment_id: doc.get("square_payment_id") ? doc.get("square_payment_id") : null,
            payment_method: doc.get("payment_method") ? doc.get("payment_method") : null,
            receive_money: doc.get("receive_money") ? doc.get("receive_money") : 0,
            change_money: doc.get("change_money") ? doc.get("change_money") : 0,
            total_money: doc.get("total_money") ? doc.get("total_money") : 0,
            earned_at: doc.get("earned_at") ? doc.get("earned_at") : null,
          }
        }
        else{
          return {
            square_order_id: null,
            square_payment_id: null,
            payment_method: null,
            receive_money: 0,
            change_money: 0,
            total_money: 0,
            earned_at: null,
          }
        }
      })
    )
  }

  async setcartorder(customer_uid,square_order_id,square_payment_id,payment_method,receive_money,change_money,total_money, earned_at){
    return await this.afstore.doc(`/tailormeasure/${this._office}/customercarts/${customer_uid}`).set({
      square_order_id: square_order_id,
      square_payment_id: square_payment_id,
      payment_method: payment_method,
      receive_money: receive_money,
      change_money: change_money,
      total_money: total_money,
      earned_at: earned_at, 
    },{merge:true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  getallcustomercart(){
    return this.afstore.collection(`/tailormeasure/${this._office}/customercarts`).get().pipe(
      map((snapshot) => {
        const results = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const cuscartdoc = snapshot.docs[i];
            results.push({
              customer_uid: cuscartdoc.id,
              matashita: cuscartdoc.get("matashita"),
              skirttake: cuscartdoc.get("skirttake"),
              ext01_name: cuscartdoc.get("ext01_name") ? cuscartdoc.get("ext01_name") : "",
              ext01_length: cuscartdoc.get("ext01_length") ? cuscartdoc.get("ext01_length") : 0,
              ext02_name: cuscartdoc.get("ext02_name") ? cuscartdoc.get("ext02_name") : "",
              ext02_length: cuscartdoc.get("ext02_length") ? cuscartdoc.get("ext02_length") : 0,
              remark: cuscartdoc.get("remark") ? cuscartdoc.get("remark") : "",
              remark2: cuscartdoc.get("remark2") ? cuscartdoc.get("remark2") : "",
              payment_method: cuscartdoc.get("payment_method") ? cuscartdoc.get("payment_method") : "",
              total_money: cuscartdoc.get("total_money") ? cuscartdoc.get("total_money") : "",
              square_order_id: cuscartdoc.get("square_order_id") ? cuscartdoc.get("square_order_id") : null,
              earned_at: cuscartdoc.get("earned_at") ? cuscartdoc.get("earned_at") : null,
              cartitems: null,
            })
          }
        }
        return results;
      })
    )
  }

  getallcartitems(){
    return this.afstore.collectionGroup(`cartitems`).get().pipe(
      map((cartitemsshop) => {
        const results = [];
        if(!cartitemsshop.empty){
          for(const i in cartitemsshop.docs){
            const doc = cartitemsshop.docs[i];
            results.push(doc.data());
          }
        }
        return results;
      })
    )
  }

  getfilteredcustomercarts(ids: string[]){
    return this.afstore.collection(`/tailormeasure/${this._office}/customercarts`).get().pipe(
      map((snapshot) => {
        const results = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const cuscartdoc = snapshot.docs[i];
            if(ids.findIndex(v => v==cuscartdoc.id) >= 0){
              results.push({
                customer_uid: cuscartdoc.id,
                matashita: cuscartdoc.get("matashita"),
                skirttake: cuscartdoc.get("skirttake"),
                ext01_name: cuscartdoc.get("ext01_name") ? cuscartdoc.get("ext01_name") : "",
                ext01_length: cuscartdoc.get("ext01_length") ? cuscartdoc.get("ext01_length") : 0,
                ext02_name: cuscartdoc.get("ext02_name") ? cuscartdoc.get("ext02_name") : "",
                ext02_length: cuscartdoc.get("ext02_length") ? cuscartdoc.get("ext02_length") : 0,
                remark: cuscartdoc.get("remark") ? cuscartdoc.get("remark") : "",
                remark2: cuscartdoc.get("remark2") ? cuscartdoc.get("remark2") : "",
                square_order_id: cuscartdoc.get("square_order_id") ? cuscartdoc.get("square_order_id") : null,
                square_payment_id: cuscartdoc.get("square_payment_id") ? cuscartdoc.get("square_payment_id") : null,
                payment_method: cuscartdoc.get("payment_method") ? cuscartdoc.get("payment_method") : "",
                total_money: cuscartdoc.get("total_money") ? cuscartdoc.get("total_money") : "",
                receive_money: cuscartdoc.get("receive_money") ? cuscartdoc.get("receive_money") : 0,
                change_money: cuscartdoc.get("change_money") ? cuscartdoc.get("change_money") : 0,
                earned_at: cuscartdoc.get("earned_at") ? cuscartdoc.get("earned_at") : null,
                cartitems: null,
                includepostage: cuscartdoc.get("includepostage") == undefined ? null : cuscartdoc.get("includepostage"),
                includepostage2: cuscartdoc.get("includepostage2") == undefined ? null : cuscartdoc.get("includepostage2"),
              })
            }
          }
        }
        return results;
      })
    )

  }

  getfilteredcartitems(ids: string[]){
    return this.afstore.collectionGroup(`cartitems`).get().pipe(
      map((cartitemssnap) => {
        const results = [];
        if(!cartitemssnap.empty){
          cartitemssnap.docs.forEach((qrydoc) => {
            const customer_uid = qrydoc.get("customer_uid");
            if(ids.findIndex(v => v==customer_uid) >= 0){
              results.push(qrydoc.data());
            }
          })
        }
        return results;
      })
    )
  }

  getpostageitem(){
    return this.afstore.doc(`/tailormeasure/${this._office}/postageitem/DEFUALT`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            item_id: doc.get("item_id"),
            item_name: doc.get("item_name"),
            variation_id: doc.get("variation_id"),
            variation_name: doc.get("variation_name"),
            price: doc.get("price"),
            sku: doc.get("sku"),
            created_at: doc.get("created_at"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  async setpostageitem(postageitem){
    postageitem.created_at = new Date().toISOString();
    return await this.afstore.doc(`/tailormeasure/${this._office}/postageitem/DEFUALT`).set({
      item_id: postageitem.item_id,
      item_name: postageitem.item_name,
      variation_id: postageitem.variation_id,
      variation_name: postageitem.variation_name,
      price: postageitem.price,
      sku: postageitem.sku,
      created_at: postageitem.created_at,
    },{merge:true})
    .then(() => {
      return postageitem;
    })
    .catch((error) => {
      throw error;
    })
  }

  async deletepostageitem(){
    return await this.afstore.doc(`/tailormeasure/${this._office}/postageitem/DEFUALT`).delete()
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    })
  }

  getprintersetting(){
    return this.afstore.doc(`/tailormeasure/${this._office}/printersetting/DEFUALT`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            printer_addr: doc.get("printer_addr"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  async setprintersetting(printer_addr){
    return await this.afstore.doc(`/tailormeasure/${this._office}/printersetting/DEFUALT`).set({
      printer_addr: printer_addr,
    },{merge:true})
    .then(() => {
      return printer_addr;
    })
    .catch((error) => {
      throw error;
    })
  }

  getbanks(){
    return this.afstore.collection(`/tailormeasure/${this._office}/banks`,ref => ref.orderBy("bank_ordinal","asc")).get().pipe(
      map((snapshot) => {
        const results = [];
        if(!snapshot.empty){
          for(const i in snapshot.docs){
            const doc = snapshot.docs[i];
            results.push({
              bank_uid: doc.get("bank_uid"),
              bank_ordinal: doc.get("bank_ordinal"),
              bank_name: doc.get("bank_name"),
              shiten_name: doc.get("shiten_name"),
              bank_kind: doc.get("bank_kind"),
              bank_koza: doc.get("bank_koza"),
              created_at: doc.get("created_at"),
            })
          }          
        }
        return results;
      })
    )
  }

  async setbank(bank){
    if(!bank.bank_uid){
      bank.bank_uid = this.afstore.createId();
    }
    bank.created_at = new Date().toISOString();
    return await this.afstore.doc(`/tailormeasure/${this._office}/banks/${bank.bank_uid}`).set({
      bank_uid: bank.bank_uid,
      bank_ordinal: bank.bank_ordinal,
      bank_name: bank.bank_name,
      shiten_name: bank.shiten_name,
      bank_kind: bank.bank_kind,
      bank_koza: bank.bank_koza,
      created_at: bank.created_at,
    },{merge:true})
    .then(() => {
      return bank;
    })
    .catch((error) => {
      throw error;
    })
  }

  getuserrole(uid: string){
    return this.afstore.doc(`/userroles/tailormeasure/accounts/${uid}`).get().pipe(
      map((doc) => {
        if(doc.exists){
          return {
            uid: uid,
            role: doc.get("role"),
          }
        }
        else{
          return null;
        }
      })
    )
  }

  getreceipt(customer_uid: string){
    return this.afstore.doc(`/tailormeasure/${this._office}/receipts/${customer_uid}`).get().pipe(
      map((qrydoc) => {
        if(qrydoc.exists){
          const receipt = qrydoc.data();
          console.log("receipt: ", receipt);
          return {
            customer_uid: qrydoc.get("customer_uid"),
            issue_no: qrydoc.get("issue_no"),
            created_at: qrydoc.get("created_at"),
          }
        }
        else{
          return {
            customer_uid: customer_uid,
            issue_no: 0,
            created_at: null,
          }
        }
      })
    );
  }

  async setreceiptissues(customer_uid: string, issue_no: number){
    const created_at = new Date();
    const receiptissue = {
      customer_uid: customer_uid,
      issue_no: issue_no,
      created_at: created_at.toISOString(),
    }
    return await Promise.resolve()
    .then(() => {
      return this.afstore.doc(`/tailormeasure/${this._office}/receipts/${customer_uid}`).set({
        customer_uid: receiptissue.customer_uid,
        issue_no: receiptissue.issue_no,
        created_at: receiptissue.created_at,
      },{merge: true});
    })
    .then(() => {
      return this.afstore.doc(`/tailormeasure/${this._office}/receipts/${customer_uid}/issues/${created_at}`).set({
        customer_uid: receiptissue.customer_uid,
        issue_no: receiptissue.issue_no,
        created_at: receiptissue.created_at,
      },{merge: true});
    })
    .then(() => {
      return receiptissue;
    })
    .catch((error) => {
      throw error;
    });
  }

  async clearreceiptissue(customer_uid: string){
    return await this.afstore.doc(`/tailormeasure/${this._office}/receipts/${customer_uid}`).set({
      customer_uid: customer_uid,
      issue_no: 0,
      created_at: null,
    },{merge: true})
    .then(() => {
      return true;
    })
    .catch((error) => {
      throw error;
    });
  }

  getallextracustomers(): Observable<ExtraCustomer[]>{
    return this.afstore.collection(`/tailormeasure/${this._office}/extracustomers`).get().pipe(
      map((qrysnapshot) => {
        const results: ExtraCustomer[] = [];
        if(!qrysnapshot.empty){
          for(const i in qrysnapshot.docs){
            const qrydoc = qrysnapshot.docs[i];
            results.push({
              customer_uid: qrydoc.get("customer_uid"),
              qr_code_id: qrydoc.get("qr_code_id"),
              customer_family_kn_name: qrydoc.get("customer_family_kn_name"),
              customer_given_kn_name: qrydoc.get("customer_given_kn_name"),
              customer_family_name: qrydoc.get("customer_family_name"),
              customer_given_name: qrydoc.get("customer_given_name"),
              customer_parent_family_kn_name: qrydoc.get("customer_parent_family_kn_name"),
              customer_parent_given_kn_name: qrydoc.get("customer_parent_given_kn_name"),
              customer_parent_family_name: qrydoc.get("customer_parent_family_name"),
              customer_parent_given_name: qrydoc.get("customer_parent_given_name"),
              email: qrydoc.get("email"),
              phone: qrydoc.get("phone"),
              zip_code: qrydoc.get("zip_code"),
              addrstate: qrydoc.get("addrstate"),
              addr1: qrydoc.get("addr1"),
              addr2: qrydoc.get("addr2"),
              addr3: qrydoc.get("addr3"),
              gender_id: qrydoc.get("gender_id"),
              shop_id: qrydoc.get("shop_id"),
              reference_id: qrydoc.get("reference_id"),
              square_customer_uid: qrydoc.get("square_customer_uid"),
              square_order_id: qrydoc.get("square_order_id"),
              square_payment_id: qrydoc.get("square_payment_id"),
              payment_method: qrydoc.get("payment_method"),
              receive_money: qrydoc.get("receive_money"),
              change_money: qrydoc.get("change_money"),
              total_money: qrydoc.get("total_money"),
              earned_at: qrydoc.get("earned_at"),
            })
          }
        }
        return results;
      })
    )
  }

  async setextracustomers(customers: ExtraCustomer[]){
    let batch = this.afstore.firestore.batch();
    let importcount = 0;
    for(const i in customers){
      const customer = customers[i];
      const importref = this.afstore.doc(`/tailormeasure/${this._office}/extracustomers/${customer.customer_uid}`).ref;
      batch.set(importref,{
        customer_uid: customer.customer_uid,
        qr_code_id: customer.qr_code_id,
        customer_family_kn_name: customer.customer_family_kn_name,
        customer_given_kn_name: customer.customer_given_kn_name,
        customer_family_name: customer.customer_family_name,
        customer_given_name: customer.customer_given_name,
        customer_parent_family_kn_name: customer.customer_parent_family_kn_name,
        customer_parent_given_kn_name: customer.customer_parent_given_kn_name,
        customer_parent_family_name: customer.customer_parent_family_name,
        customer_parent_given_name: customer.customer_parent_given_name,
        email: customer.email,
        phone: customer.phone,
        zip_code: customer.zip_code,
        addrstate: customer.addrstate,
        addr1: customer.addr1,
        addr2: customer.addr2,
        addr3: customer.addr3,
        gender_id: customer.gender_id,
        shop_id: customer.shop_id,
        reference_id: customer.reference_id,
        square_customer_uid: customer.square_customer_uid,
        square_order_id: customer.square_order_id,
        square_payment_id: customer.square_payment_id,
        payment_method: customer.payment_method,
        receive_money: customer.receive_money,
        change_money: customer.change_money,
        total_money: customer.total_money,
        earned_at: customer.earned_at,
      },{merge: true});
      importcount++;
      if(importcount >= 50){
        await batch.commit();
        importcount = 0;
        batch = this.afstore.firestore.batch();
      }
    }
    if(importcount > 0){
      await batch.commit();
    }
  }

  async deleteextracustomers(customers){
    let batch = this.afstore.firestore.batch();
    let delcount = 0;
    for(const i in customers){
      const delref = this.afstore.doc(`/tailormeasure/${this._office}/extracustomers/${customers[i].customer_uid}`).ref;
      batch.delete(delref);
      delcount++;
      if(delcount >= 100){
        await batch.commit();
        delcount = 0;
        batch = this.afstore.firestore.batch();
      }
    }
    if(delcount > 0){
      await batch.commit();
    }
  }

  async getcashapplies(uid: string, order_id: string){
    return await lastValueFrom(this.afstore.collection(`/applicationdata/HGUYsM0QS6f4fJ2OdeG8NoWOs083/cashapplies`, ref => ref.where("square_order_id", "==", order_id)).get())
    .then((qrysnapshot) => {
      const results: CashApplyWith[] = [];
      if(!qrysnapshot.empty){
        for(const i in qrysnapshot.docs){
          const qrydoc = qrysnapshot.docs[i];
          results.push({
            apply_id: qrydoc.get("apply_id"),
            excluded_at: qrydoc.get("excluded_at"),
            freee_company_id: qrydoc.get("freee_company_id"),
            freee_wallettxn_id: qrydoc.get("freee_wallettxn_id"),
            square_event_id: qrydoc.get("square_event_id"),
            square_location_id: qrydoc.get("square_location_id"),
            square_order_created_at: qrydoc.get("square_order_created_at"),
            square_order_id: qrydoc.get("square_order_id"),
            wallettxn: null,
          })
        }
      }
      return results;
    })
    .catch((error) => {
      throw error;
    });
  }

  async getfreeewallettxnfromcashapplies(uid: string, cashapplies: CashApplyWith[]): Promise<CashApplyWith[]>{
    const results: CashApplyWith[] = [];
    for(const i in cashapplies){
      const wallettxn_id = cashapplies[i].freee_wallettxn_id;
      await lastValueFrom(this.afstore.doc(`/freee/HGUYsM0QS6f4fJ2OdeG8NoWOs083/wallettxns/${wallettxn_id}`).get())
      .then((qrydoc) => {
        if(qrydoc.exists){
          results.push({
            apply_id: cashapplies[i].apply_id,
            excluded_at: cashapplies[i].excluded_at,
            freee_company_id: cashapplies[i].freee_company_id,
            freee_wallettxn_id: cashapplies[i].freee_wallettxn_id,
            square_event_id: cashapplies[i].square_event_id,
            square_location_id: cashapplies[i].square_location_id,
            square_order_created_at: cashapplies[i].square_order_created_at,
            square_order_id: cashapplies[i].square_order_id,
            wallettxn: {
              amount: qrydoc.get("amount"),
              balance: qrydoc.get("balance"),
              company_display_name: qrydoc.get("company_display_name"),
              company_id: qrydoc.get("company_id"),
              company_name: qrydoc.get("company_name"),
              company_name_kana: qrydoc.get("company_name_kana"),
              date: qrydoc.get("date"),
              description: qrydoc.get("description"),
              due_amount: qrydoc.get("due_amount"),
              entry_side: qrydoc.get("entry_side"),
              status: qrydoc.get("status"),
              walletable_id: qrydoc.get("walletable_id"),
              walletable_name: qrydoc.get("walletable_name"),
              walletable_type: qrydoc.get("walletable_type"),
              wallettxn_id: qrydoc.get("wallettxn_id"),
            }
          });
        }
      })
      .catch((error) => {
        throw error;
      })
    }
    return results;
  }

  // restoreearning
  async setrestoreearning(restoreearning: any): Promise<void>{
    await this.afstore.doc(`/tailormeasure/${this._office}/restoreearnings/${restoreearning.customer_uid}`).set({
      customer_uid: restoreearning.customer_uid,
      total_money: restoreearning.total_money,
      receive_money: restoreearning.receive_money,
      change_money: restoreearning.change_money,
      payment_method: restoreearning.payment_method,
      square_order_id: restoreearning.square_order_id,
      square_payment_id: restoreearning.square_payment_id,
      earned_at: restoreearning.earned_at,
      restored_at: restoreearning.restored_at,
    },{ merge: true });
  }

  async getrestoreearning(customer_uid: string): Promise<any | null>{
    return await lastValueFrom(this.afstore.doc(`/tailormeasure/${this._office}/restoreearnings/${customer_uid}`).get())
    .then((qrydoc) => {
      if(qrydoc.exists){
        return {
          customer_uid: qrydoc.get("customer_uid"),
          total_money: qrydoc.get("total_money"),
          receive_money: qrydoc.get("receive_money"),
          change_money: qrydoc.get("change_money"),
          payment_method: qrydoc.get("payment_method"),
          square_order_id: qrydoc.get("square_order_id"),
          square_payment_id: qrydoc.get("square_payment_id"),
          earned_at: qrydoc.get("earned_at"),
          restored_at: qrydoc.get("restored_at"),
        }
      }
      else{
        return null;
      }
    })
  }

  async setaddmovebackup(movetime: Date, backupcustomers: MoveAddCustomer[]){
    let batch = this.afstore.firestore.batch();
    let backupcount = 0;
    let backupcustomer: MoveAddCustomer;
    while ((backupcustomer = backupcustomers.shift()) !== undefined) {
      const backupref = this.afstore.doc(`/tailormeasure/${this._office}/addmovebackup/${movetime}/customers/${backupcustomer.id}`).ref;
      batch.set(backupref,{
        id: backupcustomer.id,
        family_name: backupcustomer.family_name,
        given_name: backupcustomer.given_name,
        email_address: backupcustomer.email_address,
        phone_number: backupcustomer.phone_number,
        address: {
          address_line_1: backupcustomer.address.address_line_1 ? backupcustomer.address.address_line_1 : null,
          address_line_2: backupcustomer.address.address_line_2 ? backupcustomer.address.address_line_2 : null,
          address_line_3: backupcustomer.address.address_line_3 ? backupcustomer.address.address_line_3 : null,
          country: backupcustomer.address.country,
          postal_code: backupcustomer.address.postal_code,
        },
        version: backupcustomer.version,
      });
      backupcount++;
      if (backupcount >= 100) {
        await batch.commit();
        console.log("batch commit");
        batch = this.afstore.firestore.batch();
        backupcount = 0;
      }
    }
    if (backupcount > 0) {
      await batch.commit();
      console.log("batch commit");
    }
  }
}
