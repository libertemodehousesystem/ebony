import { Component, OnInit, input, viewChild } from '@angular/core';
import { Subject } from 'rxjs';

import { CartinfoComponent } from '../../commons/cartinfo/cartinfo.component';

@Component({
  imports: [CartinfoComponent],
  selector: 'app-cartdlg',
  templateUrl: './cartdlg.component.html',
  styleUrls: ['./cartdlg.component.scss'],
})
export class CartdlgComponent implements OnInit {
  readonly customer = input(undefined);

  cartSubject: Subject<any> = new Subject();
  cartState = this.cartSubject.asObservable();

  readonly cartinfo = viewChild<CartinfoComponent>('CartInfo');

  constructor() {}

  ngOnInit(): void {}

  opendialog() {
    this.cartinfo().readcustomer(this.customer());
  }

  closedialog() {
    this.cartSubject.next(null);
  }
}
