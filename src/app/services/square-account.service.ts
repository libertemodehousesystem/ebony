import { Injectable } from '@angular/core';
import { FunctionaccessService } from './functionaccess.service';
import { Customer, StoreaccessService } from './storeaccess.service';
import * as commonlib from '@lib/shared/commons/libertelib';

@Injectable({
  providedIn: 'root'
})
export class SquareAccountService {

  constructor(
    private functionService: FunctionaccessService,
    private storeAccessService: StoreaccessService,
  ) { }


  async registSquareCustomer(customerInfo:Customer, ){
    // customer登録
    if(customerInfo.square_customer_uid){
      console.log("already saved customer!");
      return customerInfo;
    }
    return await Promise.resolve()
    .then(() => {
      return this.functionService.setcustomertosquare(customerInfo,this.storeAccessService.office);
    })
    .then((customer) => {
      console.log("customer:",customer);
      customerInfo.square_customer_uid = customer.id;
      // id: 'E1043VZ4JWT7XDJZEC33V3RK2M',
      // created_at: '2021-11-22T01:51:17.906Z',
      // updated_at: '2021-11-22T01:51:17Z',
      // given_name: 'テスト',
      // family_name: '虎雄',
      // email_address: 'sample10@liberte-mode.co.jp',
      //   address_line_1: '東京都',
      //   address_line_2: '世田谷区成城１―４４―２２',
      //   address_line_3: '建物',
      //   postal_code: '111-2222',
      //   country: 'JP'
      // phone_number: '090-7777-5588',
      // reference_id: 'e25246b968aa0a7c2f1df7db',
      // note: 'tailormeasurement',
      // creation_source: 'THIRD_PARTY'
      return this.storeAccessService.updateregistedtailorcustomer(customerInfo.customer_uid,customerInfo.square_customer_uid);
    })
    .then(() => {
      return customerInfo;
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }
}
