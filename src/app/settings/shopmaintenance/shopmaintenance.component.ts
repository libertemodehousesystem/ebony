import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { StoreaccessService } from '../../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { concatMap, debounceTime, from, Subject, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [FormsModule, NgTemplateOutlet],
  selector: 'app-shopmaintenance',
  templateUrl: './shopmaintenance.component.html',
  styleUrls: ['./shopmaintenance.component.scss']
})
export class ShopmaintenanceComponent implements OnInit, OnDestroy {
  private staService = inject(StoreaccessService);

  readonly shops = signal<any[]>([]);
  readonly newShopName = signal("");
  readonly newShopHeader = signal("");

  saveEvent: Subject<void> = new Subject<void>();
  saveSubscription: Subscription = null;

  ngOnInit(): void {
    this.getallshop();
    this.saveSubscription = this.saveEvent.pipe(
      debounceTime(1000),
      concatMap(shop => this.updateshop(shop))
    ).subscribe({
      next: () => {
        console.log("update");
      },
      error: () => {
        console.log("error");
      }
    })
  }

  ngOnDestroy(): void {
    if(this.saveSubscription){
      this.saveSubscription.unsubscribe();
    }
  }

  getallshop(){
    this.staService.getshops().subscribe({
      next: (resshops) => {
        this.shops.set(resshops);
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  registshop(){
    const registshop = {
      shop_id: null,
      shop_name: this.newShopName(),
      deliveryshopheader: this.newShopHeader(),
      created_at: null,
    }
    this.staService.setshop(registshop)
    .then((resshop) => {
      this.shops.update(shops => [...shops, resshop]);
      this.newShopName.set("");
      this.newShopHeader.set("");
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  changeshop(shop){
    this.saveEvent.next(shop);
  }

  updateshop(shop){
    return from(this.staService.setshop(shop));
  }

}
