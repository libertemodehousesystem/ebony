import { Component, inject, OnInit, signal } from '@angular/core';
import { FunctionaccessService } from '../../services/functionaccess.service';
import { StoreaccessService } from '../../services/storeaccess.service';

interface SquareCustomer {
  id: string;
  created_at: string;
  updated_at: string;
  given_name: string;
  family_name: string;
  email_address: string;
  address: {
    country: string;
    postal_code: string;
    administrative_district_level_1: string;
    locality: string;
    address_line_1: string;
    address_line_2: string;
    address_line_3: string;
  };
  phone_number: string;
  note: string;
  reference_id: string;
  preferences: { email_unsubscribed: boolean };
  creation_source: string;
  version: number;
}

interface TailorCustomer {
  customer_uid: string;
  square_customer_uid: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-funccheck',
  templateUrl: './funccheck.component.html',
  styleUrls: ['./funccheck.component.scss'],
})
export class FunccheckComponent implements OnInit {
  private fnaService = inject(FunctionaccessService);
  private staService = inject(StoreaccessService);

  readonly tailorCustomers = signal<TailorCustomer[]>([]);
  readonly customers = signal<SquareCustomer[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.staService.gettailorcustomers().subscribe({
      next: (customers) => {
        this.tailorCustomers.set(customers);
      },
      error: (err) => {
        console.error('gettailorcustomers error:', err);
      }
    });
  }

  isLinked(squareId: string): boolean {
    return this.tailorCustomers().some(c => c.square_customer_uid === squareId);
  }

  async callGetcustomersv2() {
    this.loading.set(true);
    this.customers.set([]);
    this.error.set(null);

    try {
      const response = await this.fnaService.call('getsquarecustomerontailorv2', { office: 'SHITATEKAN' });
      const res = response as { customers?: SquareCustomer[] };
      this.customers.set(Array.isArray(response) ? (response as SquareCustomer[]) : res?.customers ?? []);
    } catch (err) {
      this.error.set(err.message);
      console.error('getcustomersv2 error:', err);
    } finally {
      this.loading.set(false);
    }
  }
}
