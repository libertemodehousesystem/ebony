import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';

import * as XLSX from 'xlsx';

import { StoreaccessService } from '../../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-customermanager',
  templateUrl: './customermanager.component.html',
  styleUrls: ['./customermanager.component.scss'],
})
export class CustomermanagerComponent implements OnInit {
  private staService = inject(StoreaccessService);

  readonly customers = signal<any[]>([]);
  readonly shops = signal<any[]>([]);

  genders;

  readonly filesetector = viewChild<ElementRef>('FileSetector');

  ngOnInit(): void {
    this.genders = this.staService.genders;
    this.getcustomers();
  }

  getcustomers() {
    forkJoin([this.staService.getshops(), this.staService.gettailorcustomers()]).subscribe({
      next: (results) => {
        this.shops.set(results[0]);
        this.customers.set(results[1]);
      },
    });
  }

  exportfile() {
    let ws_name = 'Sheet1';
    let wb = XLSX.utils.book_new();
    let ws_data = [];
    ws_data.push([
      'システム利用ID',
      'QRコードID',
      '生徒 姓',
      '生徒 名',
      '生徒 姓（カナ）',
      '生徒 名（カナ）',
      '保護者 姓',
      '保護者 名',
      '保護者 姓（カナ）',
      '保護者 名（カナ）',
      '郵便番号',
      '都道府県',
      '市区町村丁目',
      '番地以降',
      '建物名',
      '電話番号',
      'メールアドレス',
      '性別',
      'ショップ',
      'スクエア顧客ID',
      '削除',
    ]);
    for (const customer of this.customers()) {
      const gender = this.genders.find((v) => v.gender_id == customer.gender_id);
      const shop = this.shops().find((v) => v.shop_id == customer.shop_id);
      ws_data.push([
        customer.customer_uid,
        customer.qr_code_id ? customer.qr_code_id : null,
        customer.customer_family_name,
        customer.customer_given_name,
        customer.customer_family_kn_name,
        customer.customer_given_kn_name,
        customer.customer_parent_family_name ? customer.customer_parent_family_name : null,
        customer.customer_parent_given_name ? customer.customer_parent_given_name : null,
        customer.customer_parent_family_kn_name ? customer.customer_parent_family_kn_name : null,
        customer.customer_parent_given_kn_name ? customer.customer_parent_given_kn_name : null,
        customer.zip_code ? customer.zip_code : null,
        customer.addrstate ? customer.addrstate : null,
        customer.addr1 ? customer.addr1 : null,
        customer.addr2 ? customer.addr2 : null,
        customer.addr3 ? customer.addr3 : null,
        customer.phone ? customer.phone : null,
        customer.email ? customer.email : null,
        // customer.gender_id ? customer.gender_id : 0,
        gender ? gender.caption : null,
        // customer.shop_id ? customer.shop_id : null,
        shop ? shop.shop_name : null,
        customer.square_customer_uid ? customer.square_customer_uid : null,
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, 'export.xlsx');
  }

  openfile() {
    const filesetector = this.filesetector();
    filesetector.nativeElement.value = '';
    filesetector.nativeElement.click();
  }

  importfile(files) {
    console.log('files:', files);
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      console.log('wsname:', wsname);
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const range = ws['!ref'];
      const decodeRange = XLSX.utils.decode_range(range);

      const importcustomers = [];
      const deletecustomers = [];
      // ヘッダーを除いて読み込む
      for (var row = 1; row <= decodeRange.e.r; row++) {
        const adduid = XLSX.utils.encode_cell({ r: row, c: 0 });
        const celluid = ws[adduid];
        const addqrcodeid = XLSX.utils.encode_cell({ r: row, c: 1 });
        const cellqrcodeid = ws[addqrcodeid];
        const addfamilyname = XLSX.utils.encode_cell({ r: row, c: 2 });
        const cellfamilyname = ws[addfamilyname];
        const addgivenname = XLSX.utils.encode_cell({ r: row, c: 3 });
        const cellgivenname = ws[addgivenname];
        const addfamilynamekana = XLSX.utils.encode_cell({ r: row, c: 4 });
        const cellfamilynamekana = ws[addfamilynamekana];
        const addgivennamekana = XLSX.utils.encode_cell({ r: row, c: 5 });
        const cellgivennamekana = ws[addgivennamekana];
        const addhparentfamilyname = XLSX.utils.encode_cell({ r: row, c: 6 });
        const cellparentfamilyname = ws[addhparentfamilyname];
        const addhparentgivenname = XLSX.utils.encode_cell({ r: row, c: 7 });
        const cellparentgivenname = ws[addhparentgivenname];
        const addparentfamilynamekana = XLSX.utils.encode_cell({ r: row, c: 8 });
        const cellparentfamilynamekana = ws[addparentfamilynamekana];
        const addparentgivennamekana = XLSX.utils.encode_cell({ r: row, c: 9 });
        const cellparentgivennamekana = ws[addparentgivennamekana];
        const addzipcode = XLSX.utils.encode_cell({ r: row, c: 10 });
        const cellzipcode = ws[addzipcode];
        const addaddrstate = XLSX.utils.encode_cell({ r: row, c: 11 });
        const celladdrstate = ws[addaddrstate];
        const addaddr1 = XLSX.utils.encode_cell({ r: row, c: 12 });
        const celladdr1 = ws[addaddr1];
        const addaddr2 = XLSX.utils.encode_cell({ r: row, c: 13 });
        const celladdr2 = ws[addaddr2];
        const addaddr3 = XLSX.utils.encode_cell({ r: row, c: 14 });
        const celladdr3 = ws[addaddr3];
        const addphone = XLSX.utils.encode_cell({ r: row, c: 15 });
        const cellphone = ws[addphone];
        const addemail = XLSX.utils.encode_cell({ r: row, c: 16 });
        const cellemail = ws[addemail];
        const addgendercaption = XLSX.utils.encode_cell({ r: row, c: 17 });
        const cellgendercaption = ws[addgendercaption];
        const addshopname = XLSX.utils.encode_cell({ r: row, c: 18 });
        const cellshopname = ws[addshopname];
        const addsqcustomerid = XLSX.utils.encode_cell({ r: row, c: 19 });
        const cellsqcustomerid = ws[addsqcustomerid];
        const adddeleteflg = XLSX.utils.encode_cell({ r: row, c: 20 });
        const celldeleteflg = ws[adddeleteflg];
        if (cellfamilyname && cellgivenname) {
          if (celldeleteflg) {
            if (celldeleteflg.v == 1) {
              deletecustomers.push({
                customer_uid: celluid ? celluid.v : null,
              });
            }
          } else {
            let gender_id = null;
            if (cellgendercaption) {
              const gender = this.genders.find((v) => v.caption == cellgendercaption.v);
              gender_id = gender ? gender.gender_id : null;
            }
            let shop_id = null;
            if (cellshopname) {
              const shop = this.shops().find((v) => v.shop_name == cellshopname.v);
              shop_id = shop ? shop.shop_id : null;
            }
            importcustomers.push({
              customer_uid: celluid ? celluid.v : null,
              qr_code_id: cellqrcodeid ? cellqrcodeid.v : null,
              customer_family_name: cellfamilyname ? cellfamilyname.v : null,
              customer_given_name: cellgivenname ? cellgivenname.v : null,
              customer_family_kn_name: cellfamilynamekana ? cellfamilynamekana.v : null,
              customer_given_kn_name: cellgivennamekana ? cellgivennamekana.v : null,
              customer_parent_family_name: cellparentfamilyname ? cellparentfamilyname.v : null,
              customer_parent_given_name: cellparentgivenname ? cellparentgivenname.v : null,
              customer_parent_family_kn_name: cellparentfamilynamekana
                ? cellparentfamilynamekana.v
                : null,
              customer_parent_given_kn_name: cellparentgivennamekana
                ? cellparentgivennamekana.v
                : null,
              zip_code: cellzipcode ? cellzipcode.v : null,
              addrstate: celladdrstate ? celladdrstate.v : null,
              addr1: celladdr1 ? celladdr1.v : null,
              addr2: celladdr2 ? celladdr2.v : null,
              addr3: celladdr3 ? celladdr3.v : null,
              phone: cellphone ? cellphone.v : null,
              email: cellemail ? cellemail.v : null,
              gender_id: gender_id,
              shop_id: shop_id,
              reference_id: null,
              square_customer_uid: cellsqcustomerid ? cellsqcustomerid.v : null,
            });
          }
        }
      }
      console.log('import customers:', importcustomers);
      for (const i in importcustomers) {
        await this.staService
          .settailorcustomer(importcustomers[i])
          .then(() => {
            //
          })
          .catch((error) => {
            commonlib.errorlog(error);
          });
      }
      console.log('delete customers:', deletecustomers);
      for (const i in deletecustomers) {
        await this.staService
          .deletetailorcustomer(deletecustomers[i].customer_uid)
          .then(() => {
            //
          })
          .catch((error) => {
            commonlib.errorlog(error);
          });
      }
      this.getcustomers();
    };
    reader.readAsBinaryString(files[0]);
  }

  getgender(gender_id) {
    const gender = this.genders.find((v) => v.gender_id == gender_id);
    return gender ? gender.caption : '';
  }

  getshop(shop_id) {
    const shop = this.shops().find((v) => v.shop_id == shop_id);
    return shop ? shop.shop_name : '';
  }
}
