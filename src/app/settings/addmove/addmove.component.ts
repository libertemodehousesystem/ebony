import { Component, inject, signal } from '@angular/core';
import { FunctionaccessService } from '../../services/functionaccess.service';
import { StoreaccessService } from '../../services/storeaccess.service';
import { DatePipe, DecimalPipe } from '@angular/common';

interface CustomerAddress {
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  postal_code: string;
  country: string;
}

interface SquareCustomer {
  id: string;
  created_at: string;
  updated_at: string;
  given_name: string;
  family_name: string;
  email_address: string;
  address: CustomerAddress;
  phone_number: string;
  note: string;
  reference_id: string;
  preferences: { email_unsubscribed: boolean };
  creation_source: string;
  version: number;
}

@Component({
  imports: [DatePipe, DecimalPipe],
  selector: 'app-addmove',
  templateUrl: './addmove.component.html',
  styleUrls: ['./addmove.component.scss'],
})
export class AddmoveComponent {
  storesrv = inject(StoreaccessService);
  fnaService = inject(FunctionaccessService);

  readonly customers = signal<SquareCustomer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);

  readonly showProgressDialog = signal(false);
  readonly progressCurrent = signal(0);
  readonly progressTotal = signal(0);
  readonly savingBackup = signal(false);

  office = "SHITATEKAN";


  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async update(customer: SquareCustomer) {
    this.updatingId.set(customer.id);
    try {
      const callname = 'updatesquarecustomerv2';
      const options = {
        office: this.office,
        customeraddress: {
          id: customer.id,
          address: {
            address_line_2: customer.address?.address_line_2 + " " + customer.address?.address_line_3,
          }
        }
      }
      console.log("options:", options);
      const response = await this.fnaService.call(callname, options);
      console.log("response:", response);
      console.log('update success:', customer.id);
    } catch (err) {
      console.error('update error:', err);
    } finally {
      this.updatingId.set(null);
    }
  }

  async bulkupdate() {
    const customeraddresses: any[] = [];
    this.customers().forEach(customer => {
      const address_line = customer.address?.address_line_3 ?
        customer.address?.address_line_2 + " " + customer.address?.address_line_3 : customer.address?.address_line_2;
      customeraddresses.push({
        id: customer.id,
        address: {
          address_line_2: address_line,
          address_line_3: null,
        }
      });
    });

    const chunkSize = 100;
    const chunks: any[][] = [];
    for (let i = 0; i < customeraddresses.length; i += chunkSize) {
      chunks.push(customeraddresses.slice(i, i + chunkSize));
    }

    this.progressTotal.set(customeraddresses.length);
    this.progressCurrent.set(0);
    this.showProgressDialog.set(true);
    this.updatingId.set('bulk');

    const movetime = new Date();
    const backupcustomers = this.customers().map(customer => ({
      id: customer.id,
      family_name: customer.family_name,
      given_name: customer.given_name,
      email_address: customer.email_address,
      phone_number: customer.phone_number,
      address: {
        address_line_1: customer.address?.address_line_1,
        address_line_2: customer.address?.address_line_2,
        address_line_3: customer.address?.address_line_3,
        country: customer.address?.country,
        postal_code: customer.address?.postal_code,
      },
      version: customer.version,
    }));
    this.savingBackup.set(true);
    await this.storesrv.setaddmovebackup(movetime, backupcustomers);
    this.savingBackup.set(false);

    try {
      const callname = 'bulkupdatesquarecustomerv2';
      for (const chunk of chunks) {
        const options = {
          office: this.office,
          customeraddresses: chunk
        };
        console.log("options:", options);
        const response = await this.fnaService.call(callname, options);
        console.log("response:", response);
        this.progressCurrent.update(v => v + chunk.length);
        await this.sleep(1000);
      }
      console.log('bulk update success');
    } catch (err) {
      console.error('update error:', err);
    } finally {
      this.updatingId.set(null);
      setTimeout(async () => {
        this.showProgressDialog.set(false);
        await this.load();
      }, 1000);
    }
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    this.customers.set([]);

    try {
      const callname = 'getsquarecustomerw3';
      const response = await this.fnaService.call(callname, { office: 'SHITATEKAN' });
      this.customers.set(Array.isArray(response) ? response : response?.customers ?? []);
    } catch (err) {
      this.error.set(err.message);
      console.error('addmove load error:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
