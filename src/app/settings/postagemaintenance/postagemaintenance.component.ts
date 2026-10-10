import { Component, inject, OnInit, signal } from '@angular/core';
import { map } from 'rxjs/operators';

import { StoreaccessService } from '../../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
@Component({
  imports: [FormsModule],
  selector: 'app-postagemaintenance',
  templateUrl: './postagemaintenance.component.html',
  styleUrls: ['./postagemaintenance.component.scss']
})
export class PostagemaintenanceComponent implements OnInit {

  postageitem = null;

  private staService = inject(StoreaccessService);

  readonly items = signal<any[]>([]);
  readonly selecteditemid = signal<string | null>(null);

  readonly selectedvariationid = signal<string | null>(null);
  readonly variations = signal<any[]>([]);

  canregist = false;

  ngOnInit(): void {
    forkJoin([this.getpostageitem(),this.getoriginalitems()]).subscribe({
      next: () => {
        if(this.postageitem){
          this.selecteditemid.set(this.postageitem.item_id);
          this.getoriginalvariations(this.selecteditemid()).subscribe({
            next: () => {
              this.selectedvariationid.set(this.postageitem.variation_id);
            },
            error: (error) => {
              commonlib.errorlog(error);
            }
          })
        }
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  getpostageitem(){
    return this.staService.getpostageitem().pipe(
      map((resitem) => {
        this.postageitem = resitem;
      })
    )    
  }

  getoriginalitems(){
    return this.staService.getoriginalitems().pipe(
      map((resitems) => {
        this.items.set(resitems);
      })
    );
  }

  itemchange(){
    const item = this.items().find(v => v.item_id==this.selecteditemid());
    if(item){
      this.getoriginalvariations(item.item_id).subscribe({
        next: () => {
          //
        },
        error: (error) => {
          commonlib.errorlog(error);
        }
      })
    }
    else{
      this.variations.set([]);
    }
  }

  getoriginalvariations(item_id){
    return this.staService.getoriginalvariation(item_id).pipe(
      map((resvariations) => {
        this.variations.set(resvariations);
      })
    );
  }

  variationchange(){
    const variation = this.variations().find(v => v.variation_id==this.selectedvariationid());
    if(variation){
      this.canregist = true;
    }
    else{
      this.canregist = false;
    }
  }

  registpostage(){
    this.canregist = false;
    const variation = this.variations().find(v => v.variation_id==this.selectedvariationid());
    const item = variation ? this.items().find(v => v.item_id==variation.item_id) : null;
    if(variation){
      const registpostageitem = {
        item_id: item.item_id,
        item_name: item.item_name,
        variation_id: variation.variation_id,
        variation_name: variation.variation_name,
        price: variation.price,
        sku: variation.sku,
        created_at: null,
      };
      console.log("registpostageitem:",registpostageitem);
      Promise.resolve()
      .then(() => {
        return this.staService.setpostageitem(registpostageitem);
      })
      .then((resitem) => {
        this.postageitem = resitem;
        this.canregist = true;
      })
      .catch((error) => {
        commonlib.errorlog(error);
        this.canregist = true;
      })
    }
    else{
      this.postageitem = null;
      this.canregist = false;
    }
  }

}
