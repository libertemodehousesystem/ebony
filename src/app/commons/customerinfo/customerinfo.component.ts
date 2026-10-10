import { Component, ElementRef, inject, OnInit, input, model, signal, viewChild } from '@angular/core';
import { Customer } from '../../services/storeaccess.service';

import { Subscription } from 'rxjs';

import { StoreaccessService } from '../../services/storeaccess.service';
import { FunctionaccessService } from '../../services/functionaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { QrreaderdlgComponent } from '@lib/liberte-qr-reader-component';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  imports: [FormsModule, NgClass, QrreaderdlgComponent],
  selector: 'app-customerinfo',
  templateUrl: './customerinfo.component.html',
  styleUrls: ['./customerinfo.component.scss'],
})
export class CustomerinfoComponent implements OnInit {
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  readonly customerinfo = model<Customer>();
  readonly canedit = input<boolean>(undefined);
  readonly cansensor = input<boolean>(true);
  readonly fromSearchDlg = input<boolean>(undefined);
  readonly cansearch = input<boolean>(false);
  readonly limited = input<boolean>(true);

  subscription: Subscription;

  readonly shops = signal<any[]>([]);
  genders = [];

  readonly customers = signal<any[]>([]);

  addrstates = [
    { caption: '神奈川県' },
    { caption: '東京都' },
    { caption: '埼玉県' },
    { caption: '千葉県' },
  ];
  readonly searchedaddrs = signal<any[]>([]);
  readonly canzipcodesearch = signal(true);
  readonly zipaddrsearchvisibility = signal<'hidden' | 'visible'>('hidden');
  readonly qrcodereadervisibility = signal<'hidden' | 'visible'>('hidden');
  readonly sensortext = signal('');
  readonly sensorreadervisibility = signal<'hidden' | 'visible'>('hidden');

  readonly qrdialog = viewChild<QrreaderdlgComponent>('QRDialog');

  readonly sensorinput = viewChild<ElementRef>('SensorInput');

  ngOnInit(): void {
    this.genders = this.staService.genders;
    this.getshops();
  }

  getshops() {
    this.staService.getshops().subscribe({
      next: (resshops) => {
        this.shops.set(resshops);
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });
  }

  suggestion(customer_family_name) {
    if (this.cansearch()) {
      if (customer_family_name.length > 0) {
        console.log('customer_family_name:', customer_family_name);
        this.customers.set([]);
        this.staService.suggestcustomer(customer_family_name).subscribe({
          next: (rescustomers) => {
            console.log('suggest rescustomers:', rescustomers);
            this.customers.set(rescustomers);
          },
        });
      } else {
        this.customers.set([]);
      }
    }
  }

  selectcustomer(customer) {
    this.customerinfo.set(customer);
    this.customers.set([]);
    this.staService.sendcustomerchange(this.customerinfo());
  }

  showqrcodereader() {
    this.subscription = this.qrdialog().resultSubject.subscribe({
      next: (result) => {
        console.log('result:', result);
        if (result) {
          this.staService.getcustomerbyqrcodeid(result.qr_code_id).subscribe({
            next: (customer) => {
              if (customer) {
                this.customerinfo.set(customer);
                this.customers.set([]);
                this.staService.sendcustomerchange(this.customerinfo());
              }
            },
          });
        }
        this.subscription.unsubscribe();
        this.qrcodereadervisibility.set('hidden');
      },
    });
    this.qrcodereadervisibility.set('visible');
  }

  changeshop(shop) {
    this.customerinfo().shop_id = shop.shop_id;
  }

  changegender(gender) {
    this.customerinfo().gender_id = gender.gender_id;
  }

  zipcodesearch() {
    if (this.customerinfo().zip_code && this.canzipcodesearch()) {
      this.canzipcodesearch.set(false);
      Promise.resolve()
        .then(() => {
          const req = {
            zipcode: this.customerinfo().zip_code,
          };
          return this.fnaService.getaddressbyzipcd(req.zipcode);
        })
        .then((resp) => {
          this.searchedaddrs.set((resp.results ?? []).map((result) => ({
            state: result.address1,
            addr1: result.address2 + result.address3,
            state_kn: result.kana1,
            addr1_kn: result.kana2 + result.kana3,
            zipcode: result.zipcode,
          })));
          this.zipaddrsearchvisibility.set('visible');
          this.canzipcodesearch.set(true);
        })
        .catch((error) => {
          commonlib.errorlog(error);
          this.canzipcodesearch.set(true);
        });
    }
  }

  closezipaddrsearch() {
    this.zipaddrsearchvisibility.set('hidden');
  }

  addressclick(searchedaddr) {
    this.customerinfo().addrstate = searchedaddr.state;
    this.customerinfo().addr1 = searchedaddr.addr1;
    this.closezipaddrsearch();
  }

  showsensordevice() {
    this.sensorreadervisibility.set('visible');
    setTimeout(() => {
      this.sensorinput().nativeElement.focus();
    }, 300);
  }

  readsensor() {
    if (this.sensortext().length > 0) {
      const qr_code_id = this.sensortext().substring(15, 35);
      this.sensortext.set('');
      this.staService.getcustomerbyqrcodeid(qr_code_id).subscribe({
        next: (customer) => {
          if (customer) {
            this.customerinfo.set(customer);
            this.customers.set([]);
            this.staService.sendcustomerchange(this.customerinfo());
          }
        },
      });
    }
    this.closesensor();
  }

  closesensor() {
    this.sensorreadervisibility.set('hidden');
  }
}
