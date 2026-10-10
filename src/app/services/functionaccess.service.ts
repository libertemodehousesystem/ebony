import { Injectable } from '@angular/core';
import { httpsCallable } from 'firebase/functions';

import { functions } from '../lib/firebase';

/**
 * Cloud Functions(onCall)呼び出し。認証は Firebase Auth のセッションが自動で付与される。
 * 失敗時は FunctionsError(code / message)で reject される。
 */
@Injectable({
  providedIn: 'root'
})
export class FunctionaccessService {

  async call<T = any>(name: string, data: object): Promise<T> {
    const result = await httpsCallable<object, T>(functions, name)(data);
    return result.data;
  }

  getcatalogcategories(office: string) {
    return this.call('getsquarecategoriesontailorv2', { office });
  }

  getcatalogitems(office: string) {
    return this.call('getsquareitemsontailorv2', { office });
  }

  getlocations(office: string) {
    return this.call('getsquarelocationsontailorv2', { office });
  }

  gettoken(code: string, office: string) {
    return this.call('getsquaretokenontailorv2', { code, office });
  }

  refreshtoken(office: string) {
    return this.call('refreshtokenontailorv2', { office });
  }

  getaddressbyzipcd(zipcode: string) {
    return this.call('getaddressv2', { zipcode });
  }

  calcorder(customer_uid: string, lineitems: any[], office: string) {
    return this.call('calcorderonsontailorv2', { customer_uid, lineitems, office });
  }

  setcustomertosquare(customer, office: string) {
    return this.call('setcustomerontailorv2', {
      office,
      customer: {
        given_name: customer.customer_given_name,
        family_name: customer.customer_family_name,
        email_address: customer.email,
        phone_number: customer.phone,
        address1: this.generateaddr1(customer.addrstate, customer.addr1),
        address2: customer.addr2,
        address3: customer.addr3,
        postal_code: customer.zip_code,
        country: "JP",
        note: "tailormeasurement",
        reference_id: customer.customer_uid,
      }
    });
  }

  generateaddr1(addrstate, addr1) {
    if (!addrstate) {
      return null;
    }
    return addr1 ? addrstate + addr1 : addrstate;
  }

  setorderandpaymenttosquare(office: string, paymethod: string, order) {
    return this.call('setorderandpaymentontailorv2', { office, paymethod, order });
  }

  refundpaymenttosquare(office: string, payment_id: string, amount_money: number) {
    return this.call('refundontailorv2', { office, payment_id, amount_money });
  }
}
