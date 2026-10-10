import { Component, inject, OnInit, signal } from '@angular/core';

import { lastValueFrom } from 'rxjs'; 

import { ExtraCustomer, StoreaccessService } from '../services/storeaccess.service';

import * as libertelib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

interface ReceiptCustomer {
  customer_name: string;
  customer_uid: string | null;
  square_order_id: string | null;
  payment_method: string | null;
  total_money: number;
  amount_money: number;
  tax_money: number;
  earned_at_ymd: string;
  issue_at: string;
  cashapplies: any[] | null;
  proviso: string;
  issue_no: number;
  issue_no_v: string;
  issue_created_at: string | null;
}

@Component({
  imports: [FormsModule, NgClass],
  selector: 'liberte-commerce-next-receipt',
  templateUrl: './receipt.component.html',
  styleUrls: ['./receipt.component.scss'],
})
export class ReceiptComponent implements OnInit {
  private staService = inject(StoreaccessService);

  private extracustomers: ExtraCustomer[] = [];

  readonly searchcustomername = signal("");
  readonly suggestedcustomers = signal<ExtraCustomer[]>([]);
  readonly receiptcustomer = signal<ReceiptCustomer>(this.emptyreceiptcustomer());
  readonly canissue = signal(false);

  private emptyreceiptcustomer(): ReceiptCustomer {
    return {
      customer_name: "",
      customer_uid: null,
      square_order_id: null,
      payment_method: null,
      total_money: 0,
      amount_money: 0,
      tax_money: 0,
      earned_at_ymd: "",
      issue_at: libertelib.convertJPv2(new Date().toISOString()),
      cashapplies: null,
      proviso: "制服代として",
      issue_no: 0,
      issue_no_v: "",
      issue_created_at: null,
    };
  }

  ngOnInit(): void {
    this.staService.getallextracustomers().subscribe({
      next: (rescustomers) => {
        this.extracustomers = rescustomers;
      }
    })
  }

  changename(){
    if(this.searchcustomername().length > 0){
      this.suggestcustomers(this.searchcustomername());
    }
  }

  suggestcustomers(value: string){
    this.suggestedcustomers.set(this.extracustomers.filter(v => v.customer_family_name.indexOf(value)>=0));
  }

  disappearsuggest(){
    this.suggestedcustomers.set([]);
  }

  async selectextracustomer(event: Event, excustomer: ExtraCustomer){
    event.stopPropagation();
    const name = `${excustomer.customer_family_name} ${excustomer.customer_given_name}`;
    this.searchcustomername.set(name);
    const amount_money = Math.floor(excustomer.total_money * 100 / 110);
    const customer: ReceiptCustomer = {
      ...this.receiptcustomer(),
      customer_uid: excustomer.customer_uid,
      customer_name: name,
      square_order_id: excustomer.square_order_id,
      payment_method: excustomer.payment_method,
      total_money: excustomer.total_money,
      amount_money: amount_money,
      tax_money: excustomer.total_money - amount_money,
      earned_at_ymd: libertelib.convertJPv2(excustomer.earned_at),
    };
    this.receiptcustomer.set(customer);
    const cashapplies = await this.staService.getcashapplies("", customer.square_order_id);
    const lastcashapplies = await this.staService.getfreeewallettxnfromcashapplies("", cashapplies);
    for(const cashapply of lastcashapplies){
      (cashapply.wallettxn as any).date_ymd = libertelib.convertJP(cashapply.wallettxn.date);
    }
    const resreceipt = await lastValueFrom(this.staService.getreceipt(customer.customer_uid));
    const issue_no = resreceipt.issue_no + 1;
    this.receiptcustomer.update(c => ({
      ...c,
      cashapplies: lastcashapplies,
      issue_no: issue_no,
      issue_no_v: libertelib.zeroPadding(issue_no, 3),
      issue_created_at: resreceipt.created_at,
    }));
    this.canissue.set(true);
    this.disappearsuggest();
  }

  async printreceipt(){
    const customer = this.receiptcustomer();
    await this.staService.setreceiptissues(customer.customer_uid, customer.issue_no);
    window.print();
    this.canissue.set(false);
    this.searchcustomername.set("");
    this.receiptcustomer.set(this.emptyreceiptcustomer());
  }
}
