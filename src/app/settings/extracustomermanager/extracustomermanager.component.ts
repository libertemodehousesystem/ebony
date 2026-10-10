import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';

import { forkJoin, lastValueFrom } from 'rxjs';

import * as XLSX from 'xlsx';

import { ExtraCustomer, StoreaccessService } from '../../services/storeaccess.service';

import * as libertelib from '@lib/shared/commons/libertelib';
import { NgClass } from '@angular/common';

@Component({
  imports: [NgClass],
  selector: 'liberte-commerce-next-extracustomermanager',
  templateUrl: './extracustomermanager.component.html',
  styleUrls: ['./extracustomermanager.component.scss'],
})
export class ExtracustomermanagerComponent implements OnInit {
  readonly fileinput = viewChild.required<ElementRef>('FileInput');
  private staService = inject(StoreaccessService);

  readonly extracustomers = signal<ExtraCustomer[]>([]);

  genders;
  shops;

  ngOnInit(): void {
    this.genders = this.staService.genders;

    this.getextracustomers();
  }

  getextracustomers() {
    forkJoin([this.staService.getshops(), this.staService.getallextracustomers()]).subscribe({
      next: (results) => {
        this.shops = results[0];
        const extracustomers: ExtraCustomer[] = results[1];
        for (const extracustomer of extracustomers) {
          const shop = this.shops.find((v) => v.shop_id == extracustomer.shop_id);
          extracustomer.shop_name = shop ? shop.shop_name : '';
          extracustomer.earned_at_ymd = extracustomer.earned_at ? libertelib.convertJP(extracustomer.earned_at) : '';
        }
        this.extracustomers.set(extracustomers);
      },
    });
  }

  async doimport(files: FileList) {
    const file = files[0];
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    await new Promise<void>((resolve) => (reader.onload = () => resolve()));
    console.log('file done');
    const workbook: XLSX.WorkBook = XLSX.read(reader.result, { type: 'binary' });
    const workbookname: string = workbook.SheetNames[0];
    console.log('workbookname:', workbookname);
    const worksheet: XLSX.WorkSheet = workbook.Sheets[workbookname];
    const range = worksheet['!ref'];
    const decodeRange = XLSX.utils.decode_range(range);
    const importexcustomers = [];
    const deleteexcustomers = [];
    // ヘッダーを除いて読み込む
    for (var row = 1; row <= decodeRange.e.r; row++) {
      const adduid = XLSX.utils.encode_cell({ r: row, c: 0 });
      const celluid = worksheet[adduid];
      const addqrcodeid = XLSX.utils.encode_cell({ r: row, c: 1 });
      const cellqrcodeid = worksheet[addqrcodeid];
      const addfamilyname = XLSX.utils.encode_cell({ r: row, c: 2 });
      const cellfamilyname = worksheet[addfamilyname];
      const addgivenname = XLSX.utils.encode_cell({ r: row, c: 3 });
      const cellgivenname = worksheet[addgivenname];
      const addfamilynamekana = XLSX.utils.encode_cell({ r: row, c: 4 });
      const cellfamilynamekana = worksheet[addfamilynamekana];
      const addgivennamekana = XLSX.utils.encode_cell({ r: row, c: 5 });
      const cellgivennamekana = worksheet[addgivennamekana];
      const addhparentfamilyname = XLSX.utils.encode_cell({ r: row, c: 6 });
      const cellparentfamilyname = worksheet[addhparentfamilyname];
      const addhparentgivenname = XLSX.utils.encode_cell({ r: row, c: 7 });
      const cellparentgivenname = worksheet[addhparentgivenname];
      const addparentfamilynamekana = XLSX.utils.encode_cell({ r: row, c: 8 });
      const cellparentfamilynamekana = worksheet[addparentfamilynamekana];
      const addparentgivennamekana = XLSX.utils.encode_cell({ r: row, c: 9 });
      const cellparentgivennamekana = worksheet[addparentgivennamekana];
      const addzipcode = XLSX.utils.encode_cell({ r: row, c: 10 });
      const cellzipcode = worksheet[addzipcode];
      const addaddrstate = XLSX.utils.encode_cell({ r: row, c: 11 });
      const celladdrstate = worksheet[addaddrstate];
      const addaddr1 = XLSX.utils.encode_cell({ r: row, c: 12 });
      const celladdr1 = worksheet[addaddr1];
      const addaddr2 = XLSX.utils.encode_cell({ r: row, c: 13 });
      const celladdr2 = worksheet[addaddr2];
      const addaddr3 = XLSX.utils.encode_cell({ r: row, c: 14 });
      const celladdr3 = worksheet[addaddr3];
      const addphone = XLSX.utils.encode_cell({ r: row, c: 15 });
      const cellphone = worksheet[addphone];
      const addemail = XLSX.utils.encode_cell({ r: row, c: 16 });
      const cellemail = worksheet[addemail];
      const addgendercaption = XLSX.utils.encode_cell({ r: row, c: 17 });
      const cellgendercaption = worksheet[addgendercaption];
      const addshopname = XLSX.utils.encode_cell({ r: row, c: 18 });
      const cellshopname = worksheet[addshopname];
      const addsqcustomerid = XLSX.utils.encode_cell({ r: row, c: 19 });
      const cellsqcustomerid = worksheet[addsqcustomerid];
      const adddeleteflg = XLSX.utils.encode_cell({ r: row, c: 20 });
      const celldeleteflg = worksheet[adddeleteflg];
      // データ作成
      if (cellfamilyname && cellgivenname) {
        if (celldeleteflg) {
          if (celldeleteflg.v == 1) {
            // delete
            deleteexcustomers.push({
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
            const shop = this.shops.find((v) => v.shop_name == cellshopname.v);
            shop_id = shop ? shop.shop_id : null;
          }
          let cartorder;
          if (celluid) {
            cartorder = await lastValueFrom(this.staService.getcartorder(celluid.v));
          } else {
            cartorder = null;
          }
          importexcustomers.push({
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
            square_order_id: cartorder ? cartorder.square_order_id : null,
            square_payment_id: cartorder ? cartorder.square_payment_id : null,
            payment_method: cartorder ? cartorder.payment_method : null,
            receive_money: cartorder ? cartorder.receive_money : null,
            change_money: cartorder ? cartorder.change_money : null,
            total_money: cartorder ? cartorder.total_money : null,
            earned_at: cartorder ? cartorder.earned_at : null,
          });
        }
      }
    }

    // インポート処理
    console.log('importcustomers:', importexcustomers);
    if (importexcustomers.length > 0) {
      await this.staService.setextracustomers(importexcustomers);
    }

    // 削除処理
    console.log('deletecustomers:', deleteexcustomers);
    if (deleteexcustomers.length > 0) {
      await this.staService.deleteextracustomers(deleteexcustomers);
    }

    // 再取得
    this.getextracustomers();

    //   // ヘッダーを除いて読み込む
    //             customer_uid: celluid ? celluid.v : null,
    //           customer_uid: celluid ? celluid.v : null,
    //           qr_code_id: cellqrcodeid ? cellqrcodeid.v : null,
    //           customer_family_name: cellfamilyname ? cellfamilyname.v : null,
    //           customer_given_name: cellgivenname ? cellgivenname.v : null,
    //           customer_family_kn_name: cellfamilynamekana ? cellfamilynamekana.v : null,
    //           customer_given_kn_name: cellgivennamekana ? cellgivennamekana.v : null,
    //           customer_parent_family_name: cellparentfamilyname ? cellparentfamilyname.v : null,
    //           customer_parent_given_name: cellparentgivenname ? cellparentgivenname.v : null,
    //           customer_parent_family_kn_name: cellparentfamilynamekana ? cellparentfamilynamekana.v : null,
    //           customer_parent_given_kn_name: cellparentgivennamekana ? cellparentgivennamekana.v : null,
    //           zip_code: cellzipcode ? cellzipcode.v : null,
    //           addrstate: celladdrstate ? celladdrstate.v : null,
    //           addr1: celladdr1 ? celladdr1.v : null,
    //           addr2: celladdr2 ? celladdr2.v : null,
    //           addr3: celladdr3 ? celladdr3.v : null,
    //           phone: cellphone ? cellphone.v : null,
    //           email: cellemail ? cellemail.v : null,
    //           gender_id: gender_id,
    //           shop_id: shop_id,
    //           reference_id: null,
    //           square_customer_uid: cellsqcustomerid ? cellsqcustomerid.v : null,
    //       //
    //       //
  }

  openfile(event: Event) {
    const fileinput = this.fileinput();
    fileinput.nativeElement.value = '';
    fileinput.nativeElement.click();
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
    for (const excustomer of this.extracustomers()) {
      const gender = this.genders.find((v) => v.gender_id == excustomer.gender_id);
      const shop = this.shops.find((v) => v.shop_id == excustomer.shop_id);
      ws_data.push([
        excustomer.customer_uid,
        excustomer.qr_code_id ? excustomer.qr_code_id : null,
        excustomer.customer_family_name,
        excustomer.customer_given_name,
        excustomer.customer_family_kn_name,
        excustomer.customer_given_kn_name,
        excustomer.customer_parent_family_name ? excustomer.customer_parent_family_name : null,
        excustomer.customer_parent_given_name ? excustomer.customer_parent_given_name : null,
        excustomer.customer_parent_family_kn_name
          ? excustomer.customer_parent_family_kn_name
          : null,
        excustomer.customer_parent_given_kn_name ? excustomer.customer_parent_given_kn_name : null,
        excustomer.zip_code ? excustomer.zip_code : null,
        excustomer.addrstate ? excustomer.addrstate : null,
        excustomer.addr1 ? excustomer.addr1 : null,
        excustomer.addr2 ? excustomer.addr2 : null,
        excustomer.addr3 ? excustomer.addr3 : null,
        excustomer.phone ? excustomer.phone : null,
        excustomer.email ? excustomer.email : null,
        // customer.gender_id ? customer.gender_id : 0,
        gender ? gender.caption : null,
        // customer.shop_id ? customer.shop_id : null,
        shop ? shop.shop_name : null,
        excustomer.square_customer_uid ? excustomer.square_customer_uid : null,
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, 'export.xlsx');
  }
}
