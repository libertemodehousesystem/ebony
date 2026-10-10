import { Component, inject, OnInit, signal } from '@angular/core';

import { StoreaccessService } from '../../services/storeaccess.service';
import { NgClass } from '@angular/common';

@Component({
  imports: [NgClass],
  selector: 'app-squarestart',
  templateUrl: './squarestart.component.html',
  styleUrls: ['./squarestart.component.scss']
})
export class SquarestartComponent implements OnInit {

  private staService = inject(StoreaccessService);

  readonly accessflg = signal(false);
  readonly starturl = signal<string | null>(null);
  readonly client_id = signal<string | null>(null);
  scopes = [
    "BANK_ACCOUNTS_READ",
    "CASH_DRAWER_READ",
    "CUSTOMERS_READ",
    "CUSTOMERS_WRITE",
    "DEVICE_CREDENTIAL_MANAGEMENT",
    "EMPLOYEES_READ",
    "INVENTORY_READ",
    "ITEMS_READ",
    "ITEMS_WRITE",
    "LOYALTY_READ",
    "MERCHANT_PROFILE_READ",
    "ORDERS_READ",
    "ORDERS_WRITE",
    "PAYMENTS_READ",
    "PAYMENTS_WRITE",
    "SETTLEMENTS_READ",
    "TIMECARDS_READ",
  ]

  scope = this.scopes.join(" ");
  state = null;

  ngOnInit(): void {
    this.staService.getaccessinformation().subscribe((access) => {
      this.accessflg.set(!!access?.basepath);
      this.starturl.set(access?.basepath ? access.basepath + "/oauth2/authorize" : null);
      this.client_id.set(access?.client_id ?? null);
    });
  }
}
