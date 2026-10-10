import { Component, inject, OnInit, signal } from '@angular/core';

import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { StoreaccessService, ItemCategory, OriginalCategory } from '../../services/storeaccess.service';
import { FunctionaccessService } from '../../services/functionaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [FormsModule, NgClass, NgTemplateOutlet],
  selector: 'app-itemcategorymaintenance',
  templateUrl: './itemcategorymaintenance.component.html',
  styleUrls: ['./itemcategorymaintenance.component.scss']
})
export class ItemcategorymaintenanceComponent implements OnInit {
  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  originalcategories: OriginalCategory[] = [];
  readonly filteredoriginals = signal<OriginalCategory[]>([]);
  readonly categories = signal<ItemCategory[]>([]);

  ngOnInit(): void {
    forkJoin([this.getoriginalcategories(),this.getitemcategories()]).subscribe({
      next: () => this.updatefilteredoriginals(),
    })
  }

  private updatefilteredoriginals(){
    const categories = this.categories();
    this.filteredoriginals.set(this.originalcategories.filter(original => !categories.find(v => v.category_id==original.category_id)));
  }

  getoriginalcategories():Observable<OriginalCategory[]>{
    return this.staService.getoriginalcategories().pipe(
      map((original) => {
        this.originalcategories = original;
        return original;
      })
    );
  }

  getitemcategories():Observable<ItemCategory[]>{
    return this.staService.gettailoritemcategories().pipe(
      map((resp) => {
        this.categories.set(resp);
        return resp;
      })
    );
  }

  prevmove(i: number){
    this.swapcategories(i - 1, i);
  }

  nextmove(i: number){
    this.swapcategories(i, i + 1);
  }

  private swapcategories(i: number, j: number){
    const categories = [...this.categories()];
    [categories[i], categories[j]] = [categories[j], categories[i]];
    const holdindex = categories[i].category_index;
    categories[i].category_index = categories[j].category_index;
    categories[j].category_index = holdindex;
    this.categories.set(categories);
    Promise.resolve()
    .then(() => this.staService.updatetailoritemcategory(categories[i]))
    .then(() => this.staService.updatetailoritemcategory(categories[j]))
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  updatecategory(category){
    this.staService.updatetailoritemcategory(category)
    .then((category) => {
      //
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  linkcategory(){
    Promise.resolve()
    .then(() => {
      return this.fnaService.getcatalogcategories(this.staService.office);
    })
    .then(() => {
      this.getoriginalcategories().subscribe({
        next: () => this.updatefilteredoriginals(),
      })
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  additemcategory(original,i){
    const registcategory = {
      category_id: original.category_id,
      category_index: 0,
      category_name: original.category_name,
      category_subname: original.category_name,
      category_color: "#000000",
      category_background_color: "#ffffff",
      created_at: null,
    }
    this.staService.settailoritemcategory(registcategory)
    .then((rescategory) => {
      this.filteredoriginals.update(originals => originals.filter((_, index) => index !== i));
      if(!this.categories().find(v => v.category_id==rescategory.category_id)){
        this.categories.update(categories => [...categories, rescategory]);
      }
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

}
