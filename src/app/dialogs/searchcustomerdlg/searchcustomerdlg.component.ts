import { Component, inject, OnInit, input, signal } from '@angular/core';

import { Subject } from 'rxjs';

import { Customer, StoreaccessService } from '../../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-searchcustomerdlg',
  templateUrl: './searchcustomerdlg.component.html',
  styleUrls: ['./searchcustomerdlg.component.scss'],
})
export class SearchcustomerdlgComponent implements OnInit {
  readonly customer = input(undefined);

  private staService = inject(StoreaccessService);

  customers = [];

  readonly searchletter = signal('');
  readonly filteredcustomers = signal<any[]>([]);

  resultSubject: Subject<any> = new Subject();
  resultState = this.resultSubject.asObservable();

  ngOnInit(): void {
    this.getlinkagecustomers();
  }

  getlinkagecustomers() {
    this.customers = [];
    this.staService.gettailorcustomers().subscribe({
      next: (rescustomers) => {
        for (const i in rescustomers) {
          this.customers.push({
            customer_uid: rescustomers[i].customer_uid,
            customer_family_kn_name: rescustomers[i].customer_family_kn_name,
            customer_given_kn_name: rescustomers[i].customer_given_kn_name,
            customer_family_name: rescustomers[i].customer_family_name,
            customer_given_name: rescustomers[i].customer_given_name,
            customer_parent_family_kn_name: rescustomers[i].customer_parent_family_kn_name,
            customer_parent_given_kn_name: rescustomers[i].customer_parent_given_kn_name,
            customer_parent_family_name: rescustomers[i].customer_parent_family_name,
            customer_parent_given_name: rescustomers[i].customer_parent_given_name,
            email: rescustomers[i].email,
            phone: rescustomers[i].phone,
            addrstate: rescustomers[i].addrstate,
            addr1: rescustomers[i].addr1,
            addr2: rescustomers[i].addr2,
            addr3: rescustomers[i].addr3,
            zip_code: rescustomers[i].zip_code,
            gender_id: rescustomers[i].gender_id,
            shop_id: rescustomers[i].shop_id,
            reference_id: rescustomers[i].reference_id,
          });
        }
        //並び替え
        this.customers.sort((a, b) => {
          if (a.customer_family_kn_name > b.customer_family_kn_name) return 1;
          if (a.customer_family_kn_name < b.customer_family_kn_name) return -1;
          return 0;
        });
        console.log('customers:', this.customers);
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    });
  }

  dofilter() {
    const sletter = commonlib.kanatohira(this.searchletter());
    this.filteredcustomers.set(this.customers.filter((customer) =>
      customer.customer_family_name && customer.customer_family_kn_name &&
      (customer.customer_family_name.indexOf(sletter) >= 0 ||
        customer.customer_family_kn_name.indexOf(sletter) == 0)
    ));
  }

  closedialog() {
    this.resultSubject.next(null);
    this.filteredcustomers.set([]);
  }

  selectcustomer(customer) {
    this.resultSubject.next(customer);
    this.filteredcustomers.set([]);
  }

  filteredphone(value) {
    let result = '';
    if (value) {
      for (let i = 0; i < value.length - 4; i++) {
        if (value[i] == '-') {
          result += value[i];
        } else {
          result += '*';
        }
      }
      result += value.substring(value.length - 4, value.length);
    }
    return result;
  }
}
