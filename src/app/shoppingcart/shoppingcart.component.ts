import { Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { AuthaccessService } from '../services/authaccess.service';
import { StoreaccessService, Customer, emptyCustomer } from '../services/storeaccess.service';
import { FunctionaccessService } from '../services/functionaccess.service';

import { CartinfoComponent } from '../commons/cartinfo/cartinfo.component';
import { CustomerinfoComponent } from '../commons/customerinfo/customerinfo.component';

import * as commonlib from '@lib/shared/commons/libertelib';

@Component({
  imports: [FormsModule, CartinfoComponent, CustomerinfoComponent],
  selector: 'app-shoppingcart',
  templateUrl: './shoppingcart.component.html',
  styleUrls: ['./shoppingcart.component.scss'],
})
export class ShoppingcartComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private activatedroute = inject(ActivatedRoute);
  private auaService = inject(AuthaccessService);
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  cansearch = false;

  readonly customerinfo = signal<Customer>(emptyCustomer());

  readonly cartinfo = viewChild<CartinfoComponent>('CartInfo');

  readonly registing = signal(false);
  readonly targetcheckcomment = signal<any>(null);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    const tailoruser = this.auaService.tailoruser;
    if (!tailoruser || !(tailoruser.role == 'super' || tailoruser.role == 'operator')) {
      this.router.navigate(['']);
      return;
    }
    this.cansearch = tailoruser.role == 'super';
    this.subscriptions.push(this.staService.customerState.subscribe({
      next: (customer) => {
        this.customerinfo.set(customer);
        this.cartinfo().readcustomer(customer);
        this.subscriptions.push(this.staService.getcheckcomment(customer.customer_uid).subscribe({
          next: (result) => {
            this.targetcheckcomment.set(result);
          },
          error: (error) => {
            commonlib.errorlog(error);
          },
        }));
      },
      error: (error) => {
        commonlib.errorlog(error);
      },
    }));
    this.subscriptions.push(this.activatedroute.paramMap.subscribe({
      next: (routeparams) => {
        const rev_customer_uid = routeparams.get('customer_uid');
        if (rev_customer_uid) {
          this.staService.gettailorcustomer(rev_customer_uid).subscribe({
            next: (res_customer) => {
              this.customerinfo.set(res_customer);
              this.staService.sendcustomerchange(res_customer);
            },
          });
        }
      },
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  routingmeasuring() {
    this.router.navigate(['measuring', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingpurchase() {
    this.router.navigate(['purchasing', { customer_uid: this.customerinfo().customer_uid }]);
  }

  routingaccounting() {
    this.router.navigate(['accounting', { customer_uid: this.customerinfo().customer_uid }]);
  }

  goregister() {
    this.registing.set(true);
    // customer登録
    this.fnaService.setcustomertosquare(this.customerinfo(), this.staService.office)
      .then(() => {
        this.registing.set(false);
      })
      .catch((error) => {
        commonlib.errorlog(error);
        this.registing.set(false);
      });
  }

  inputaddress(event) {
    let value = (event.currentTarget as HTMLInputElement).value;
    if (value == '') value = null;
    this.targetcheckcomment().receipt_address = value;
    this.updatereceiptcomment();
  }

  inputproviso(event) {
    let value = (event.currentTarget as HTMLInputElement).value;
    if (value == '') value = null;
    this.targetcheckcomment().receipt_proviso = value;
    this.updatereceiptcomment();
  }

  updatereceiptcomment() {
    if (this.targetcheckcomment().receipt_address == '')
      this.targetcheckcomment().receipt_address = null;
    if (this.targetcheckcomment().receipt_proviso == '')
      this.targetcheckcomment().receipt_proviso = null;
    if (this.customerinfo()) {
      this.staService
        .setcheckcomment(this.customerinfo().customer_uid, this.targetcheckcomment())
        .then(() => {
          console.log('updated');
        });
    }
  }
}
