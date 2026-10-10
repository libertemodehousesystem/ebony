import { AfterViewInit, Component, inject, OnInit, signal, viewChild } from '@angular/core';

import { Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';

import { AuthaccessService } from '../services/authaccess.service';
import { StoreaccessService, Customer, copyCustomer, emptyCustomer } from '../services/storeaccess.service';

import { SearchcustomerdlgComponent } from '../dialogs/searchcustomerdlg/searchcustomerdlg.component';

import * as commonlib from '@lib/shared/commons/libertelib';
import { CustomerinfoComponent } from '../commons/customerinfo/customerinfo.component';

@Component({
  imports: [CustomerinfoComponent, SearchcustomerdlgComponent, QRCodeComponent],
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss'],
})
export class CustomerComponent implements OnInit, AfterViewInit {
  private router = inject(Router);
  private auaService = inject(AuthaccessService);
  private staService = inject(StoreaccessService);

  cansearch = false;

  readonly customerinfo = signal<Customer>(emptyCustomer());

  readonly qrcodevalue = signal<string | null>(null);
  qrsize = 200;

  readonly fromSearchDlg = signal(false);
  readonly searchdlg = viewChild<SearchcustomerdlgComponent>('SearcgDlg');
  readonly searchvisibility = signal<'hidden' | 'visible'>('hidden');

  ngOnInit(): void {
    // ログインユーザー限定
    const tailoruser = this.auaService.tailoruser;
    if (!tailoruser || !(tailoruser.role == 'super' || tailoruser.role == 'operator')) {
      this.router.navigate(['']);
      return;
    }
    this.cansearch = tailoruser.role == 'super';

    const saved = this.auaService.tailorcustomer;
    if (saved) {
      this.customerinfo.set(saved);
      this.generateQRcode();
    }
  }

  ngAfterViewInit(): void {
    this.staService.customerState.subscribe({
      next: (rescustomer) => {
        this.customerinfo.set(copyCustomer(rescustomer));
      },
    });
    this.searchdlg().resultState.subscribe({
      next: (rescustomer) => {
        if (rescustomer) {
          this.fromSearchDlg.set(true);
          this.customerinfo.set(copyCustomer(rescustomer));
        }
        this.searchvisibility.set('hidden');
      },
    });
  }

  generateQRcode() {
    this.qrcodevalue.set(JSON.stringify({ qr_code_id: this.customerinfo().qr_code_id }));
  }

  registcustomer() {
    if (
      commonlib.kanjicheck(this.customerinfo().customer_family_kn_name) ||
      commonlib.kanjicheck(this.customerinfo().customer_given_kn_name)
    ) {
      alert('生徒名のフリガナに漢字が含まれています。');
      return;
    }
    if (!this.customerinfo().customer_family_name || !this.customerinfo().customer_given_name) {
      alert('生徒様のお名前が入力されていません。');
      return;
    }
    if (!this.customerinfo().customer_family_kn_name || !this.customerinfo().customer_given_kn_name) {
      alert('生徒様のお名前（カナ）が入力されていません。');
      return;
    }
    if (
      !this.customerinfo().customer_parent_family_name ||
      !this.customerinfo().customer_parent_given_name
    ) {
      alert('保護者様のお名前が入力されていません。');
      return;
    }
    if (!this.customerinfo().email) {
      alert('メールアドレスが入力されていません。');
      return;
    }
    this.customerinfo().email = this.customerinfo().email.trim();
    this.customerinfo().customer_family_kn_name = commonlib.hiraToKana(
      this.customerinfo().customer_family_kn_name,
    );
    this.customerinfo().customer_given_kn_name = commonlib.hiraToKana(
      this.customerinfo().customer_given_kn_name,
    );

    console.log('custamerinfo:', this.customerinfo());

    this.staService
      .settailorcustomer(this.customerinfo())
      .then((rescustomer) => {
        console.log('rescustomer:', rescustomer);
        this.customerinfo.set(rescustomer);
        this.auaService.customersavestorage(this.customerinfo());
        this.generateQRcode();
      })
      .catch((error) => {
        commonlib.errorlog(error);
      });
  }

  resetcustomer() {
    this.auaService.customerresetstorage();
    this.fromSearchDlg.set(false);
    this.customerinfo.set(emptyCustomer());
    this.qrcodevalue.set(null);
  }

  opensearch() {
    this.searchvisibility.set('visible');
  }

  qrprint() {
    window.print();
    setTimeout(() => {
      this.resetcustomer();
    }, 1000);
  }
}
