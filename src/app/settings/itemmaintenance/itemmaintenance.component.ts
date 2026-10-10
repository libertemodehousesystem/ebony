import { Component, inject, OnInit, signal } from '@angular/core';

import { map } from 'rxjs/operators';

import { StoreaccessService, Item } from '../../services/storeaccess.service';
import { FunctionaccessService } from '../../services/functionaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgClass, NgTemplateOutlet } from '@angular/common';

@Component({
  imports: [FormsModule, NgClass, NgTemplateOutlet],
  selector: 'app-itemmaintenance',
  templateUrl: './itemmaintenance.component.html',
  styleUrls: ['./itemmaintenance.component.scss']
})
export class ItemmaintenanceComponent implements OnInit {

  private staService = inject(StoreaccessService);
  private fnaService = inject(FunctionaccessService);

  readonly shops = signal<any[]>([]);
  readonly cartplates = signal<any[]>([]);
  readonly items = signal<any[]>([]);
  readonly filtereditems = signal<any[]>([]);

  categories = [];
  genders;
  postages;

  originalitems = [];

  ngOnInit(): void {
    this.genders = this.staService.genders;
    this.postages = this.staService.postages;
    this.getallshop();
    forkJoin([this.getcategories(),this.getitems(),this.getoriginalitems(),this.getcartplates()]).subscribe({
      next: () => {
        this.updatefiltereditems();
        const cartplates = this.cartplates();
        for(const item of this.items()){
          const category = this.categories.find(v => v.category_id==item.item_category_id);
          if(category){
            item.item_category_subname = category.category_subname;
          }
          if(item.cartplate){
            const cartplate = cartplates.find(v => v.plate_id==item.cartplate.plate_id);
            item.cartplate_id = cartplate ? cartplate.plate_id : null;
          }
          else{
            item.cartplate_id = null;
          }
        }
        this.items.update(items => [...items]);
      }
    });
  }

  // Square の商品のうち、まだ登録されていないものを一覧にする
  private updatefiltereditems(){
    const items = this.items();
    this.filtereditems.set(this.originalitems.filter(original => !items.find(v => v.item_id==original.item_id)));
  }

  getallshop(){
    this.staService.getshops().subscribe({
      next: (respshops) => {
        this.shops.set(respshops);
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  getcategories(){
    return this.staService.gettailoritemcategories().pipe(
      map((rescategories) => {
        this.categories = rescategories;
      })
    )
  }

  getoriginalitems(){
    return this.staService.getoriginalitems().pipe(
      map((resitems) => {
        this.originalitems = resitems;
      })
    );
  }

  getitems(){
    return this.staService.getitems().pipe(
      map((resitems) => {
        this.items.set(resitems);
      })
    )
  }

  getcartplates(){
    return this.staService.getcartplates().pipe(
      map((resplates) => {
        this.cartplates.set(resplates);
      })
    )
  }


  categorychange(event:InputEvent,item){
    const target = event.currentTarget as HTMLInputElement;
    console.log("category_id:",target.value);
    const category = this.categories.find(v => v.category_id==target.value);
    item.item_category_color = category.category_color;
    item.item_category_background_color = category.category_background_color;
    item.item_category_index = category.category_index;
    if(item.item_id){
      this.updateitem(item);
    }
  }

  ischecked(item,shop_id){
    const shop = item.shops.find(v => v.shop_id==shop_id);
    if(shop){
      return true;
    }
    else{
      return false;
    }
  }

  clearshops(){
    const elements = Array.from(document.getElementsByClassName("shopcheckbox")) as HTMLInputElement[];
    elements.forEach(element => element.checked=false);
  }

  changeshoptoggle(event:MouseEvent,item,shop_id){
    const target = event.currentTarget as HTMLInputElement;
    if(target.checked){
      // 追加
      const shop = this.shops().find(v => v.shop_id==shop_id);
      if(shop){
        item.shops.push(shop);
      }
    }
    else{
      // 削除
      for(let i=0;i<item.shops.length;i++){
        if(item.shops[i].shop_id==shop_id){
          item.shops.splice(i,1);
        }
      }
    }
    console.log("item.shops:",item.shops);
    if(item.item_id){
      this.updateitem(item);
    }
  }

  deleteitem(i){
    this.staService.deleteitem(this.items()[i])
    .then(() => {
      this.items.update(items => items.filter((_, index) => index !== i));
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  updatevariation(item,i){
    this.staService.getoriginalvariation(item.item_id).subscribe({
      next: (resvariations) => {
        for(const i in resvariations){
          resvariations[i].variation_name  = resvariations[i].variation_name.length > 0 ? resvariations[i].variation_name :item.item_name;
          const variation = item.variations.find(v => v.variation_id==resvariations[i].variation_id);
          if(variation){
            resvariations[i].candisplay = variation.candisplay;
          }
          else{
            resvariations[i].candisplay = "visible";
          }
        }
        item.variations = resvariations;
        this.items.update(items => [...items]);
        this.staService.setitem(item)
        .then(() => {
        })
        .catch((error) => {
          commonlib.errorlog(error);
        })
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  async updateitemname(item, i){
    // originからitemへ
    const finditem = this.originalitems.find(v => v.item_id==item.item_id);
    if(finditem){
      const updateitem = await this.staService.setitemname(finditem)
      const target = this.items().find(v => v.item_id==updateitem.item_id);
      if(target){
        target.item_name = updateitem.item_name;
        this.items.update(items => [...items]);
      }
    }
  }

  linkitem(){
    Promise.resolve()
    .then(() => {
      return this.fnaService.getcatalogitems(this.staService.office);
    })
    .then(() => {
      this.getoriginalitems().subscribe({
        next: () => this.updatefiltereditems(),
      });
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  additem(original,i){
    this.staService.getoriginalvariation(original.item_id).subscribe({
      next: (resvariations) => {
        this.filtereditems.update(filtered => filtered.filter((_, index) => index !== i));
        for(const i in resvariations){
          resvariations[i].variation_name  = resvariations[i].variation_name.length > 0 ? resvariations[i].variation_name :original.item_name;
        }
        const category = this.categories.find(v => v.category_id==original.category_id);
        const registitem = {
          item_id: original.item_id,
          item_name: original.item_name,
          item_category_id: original.category_id,
          item_category_subname: category ? category.category_subname : null,
          item_color: "#000000",
          item_background_color: original.label_color ? "#"+original.label_color : "#ffffff",
          item_index: this.items().length + 1,
          variations: resvariations,
          showmeasuring: false,
          diffsizing: false,
          pickupitem: false,
          postage_id: 0,
          shops: [],
          genders: [],
          cartplate: null,
          created_at: null,
          candisplay: "visible",
        }
        this.staService.setitem(registitem)
        .then(() => {
          this.items.update(items => [...items, registitem]);
        })
        .catch((error) => {
          commonlib.errorlog(error);
        })
      },
      error: (error) => {
        commonlib.errorlog(error);
      }
    })
  }

  updateitem(item){
    this.staService.setitem(item)
    .then((resitem) => {
      console.log("res item:",resitem);
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  changepostagetoggle(event: MouseEvent, item, postage_id){
    const target = event.currentTarget as HTMLInputElement;
    item.postage_id = postage_id;
    if(item.item_id){
      this.updateitem(item);
    }
  }

  changegendertoggle(event:MouseEvent,item,gender_id){
    const target = event.currentTarget as HTMLInputElement;
    if(target.checked){
      // 追加
      const gender = this.genders.find(v => v.gender_id==gender_id);
      if(gender){
        item.genders.push(gender);
      }
    }
    else{
      // 削除
      for(let i=0;i<item.genders.length;i++){
        if(item.genders[i].gender_id==gender_id){
          item.genders.splice(i,1);
        }
      }
    }
    console.log("item.genders:",item.genders);
    if(item.item_id){
      this.updateitem(item);
    }
  }

  isgenderchecked(item,gender_id){
    const gender = item.genders.find(v => v.gender_id==gender_id);
    if(gender){
      return true;
    }
    else{
      return false;
    }
  }

  cartplateselect(event:MouseEvent,item){
    const target = event.currentTarget as HTMLSelectElement;
    const cartplate = this.cartplates().find(v => v.plate_id==target.value);
    item.cartplate = cartplate ? cartplate : null;
    item.cartplate_id = cartplate ? cartplate.plate_id : null;
    this.updateitem(item);
  }

  changevariationdisplay(event:MouseEvent,variation,item){
    const target = event.currentTarget as HTMLElement;
    if(variation.candisplay=="visible"){
      variation.candisplay = "hidden";
    }
    else{
      variation.candisplay = "visible";
    }
    // 更新
    this.staService.setitem(item)
    .then(() => {
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  chageitemordinal(item,i,value,isfirst,islast){
    const stockvariations = [];
    for(const i in item.variations){
      stockvariations.push({
        variation_id: item.variations[i].variation_id,
        variation_name: item.variations[i].variation_name,
        item_id: item.variations[i].item_id,
        candisplay: item.variations[i].candisplay,
        ordinal: item.variations[i].ordinal,
        is_deleted: item.variations[i].is_deleted,
        linked_at: item.variations[i].linked_at,
        present_at_all_locations: item.variations[i].present_at_all_locations,
        present_at_location_ids: item.variations[i].present_at_location_ids,
        price: item.variations[i].price,
        sku: item.variations[i].sku,
        updated_at: item.variations[i].updated_at,
      })
    }
    const stockshops = [];
    for(const i in item.shops){
      stockshops.push({
        shop_id: item.shops[i].shop_id,
        shop_name: item.shops[i].shop_name,
        created_at: item.shops[i].created_at,
      })
    }
    const stockgenders = [];
    for(const i in item.genders){
      stockgenders.push({
        gender_id: item.genders[i].gender_id,
        caption: item.genders[i].caption,
      })
    }
    const cpgenders = [];
    for(const i in item.cartplate.genders){
      cpgenders.push({
        gender_id: item.cartplate.genders[i].gender_id,
        caption: item.cartplate.genders[i].caption,
      })
    }
    const stockcartplate = {
      plate_id: item.cartplate.plate_id,
      caption: item.cartplate.caption,
      genders: cpgenders,
      ordinal: item.cartplate.ordinal,
    };
    const stockitem = {
      item_id: item.item_id,
      item_name: item.item_name,
      item_category_id: item.item_category_id,
      item_category_subname: item.item_category_subname,
      item_color: item.item_color,
      item_background_color: item.item_background_color,
      item_index: item.item_index,
      variations: stockvariations,
      showmeasuring: item.showmeasuring,
      diffsizing: item.diffsizing,
      shops: stockshops,
      genders: stockgenders,
      cartplate_id: item.cartplate_id,
      cartplate: stockcartplate,
      created_at: item.created_at,
    }
    const items = [...this.items()];
    items[i] = items[i+value];
    const replace_index = items[i].item_index;
    items[i+value] = stockitem;
    items[i].item_index = stockitem.item_index;
    items[i+value].item_index = replace_index;
    this.items.set(items);
    this.updateitem(items[i]);
    this.updateitem(items[i+value]);
  }
}
