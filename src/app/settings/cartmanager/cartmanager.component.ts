import { Component, inject, OnInit, signal } from '@angular/core';

import { StoreaccessService } from '../../services/storeaccess.service';

import * as commonlib from '@lib/shared/commons/libertelib';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  imports: [FormsModule, NgClass],
  selector: 'app-cartmanager',
  templateUrl: './cartmanager.component.html',
  styleUrls: ['./cartmanager.component.scss']
})
export class CartmanagerComponent implements OnInit {

  private staService = inject(StoreaccessService);

  readonly cartplates = signal<any[]>([]);
  readonly genders = signal<any[]>([]);

  defaultpaltes =[
    {caption:"制服（上）",ordinal:1,genders:[],displayqrcode: false},
    {caption:"制服（下）",ordinal:2,genders:[],displayqrcode: false},
    {caption:"シャツ",ordinal:3,genders:[],displayqrcode: false},
    {caption:"ブラウス・シャツ",ordinal:4,genders:[],displayqrcode: false},
    {caption:"ニット",ordinal:5,genders:[],displayqrcode: false},
    {caption:"ベルト",ordinal:6,genders:[],displayqrcode: false},
    {caption:"ネクタイ",ordinal:7,genders:[],displayqrcode: false},
    {caption:"ネクタイ・リボン",ordinal:8,genders:[],displayqrcode: false},
    {caption:"ソックス",ordinal:9,genders:[],displayqrcode: false},
    {caption:"靴",ordinal:10,genders:[],displayqrcode: false},
  ];

  ngOnInit(): void {
    this.getcartplates();
  }

  getcartplates(){
    this.genders.set(this.staService.genders);
    this.staService.getcartplates().subscribe({
      next: (resplates) => {
        this.cartplates.set(resplates);
      }
    })
  }

  async generatedefaultplates(){
    for(const i in this.defaultpaltes){
      await this.staService.setcartplate(this.defaultpaltes[i])
      .then(() => {
        //
      })
      .catch((error) => {
        commonlib.errorlog(error);
      })
    }
    this.getcartplates();
  }

  isgendercheck(cartplate,gender_id){
    const gender = cartplate.genders.find(v => v.gender_id==gender_id);
    if(gender){
      return true;
    }
    else{
      return false;
    }
  }

  changecartpaltegender(event:MouseEvent,cartplate,gender_id){
    const target = event.currentTarget as HTMLInputElement;
    if(target.checked){
      // 追加
      const gender = this.genders().find(v => v.gender_id==gender_id);
      if(gender){
        cartplate.genders.push(gender);
      }
    }
    else{
      // 削除
      for(let i=0;i<cartplate.genders.length;i++){
        if(cartplate.genders[i].gender_id==gender_id){
          cartplate.genders.splice(i,1);
        }
      }
    }
    console.log("cartplate.genders:",cartplate.genders);
    this.staService.setcartplate(cartplate)
    .then(() => {
      //
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }

  async changegenerateqrcode(event,cartplate){
    console.log("cartplate:", cartplate);
    await this.staService.setcartplate(cartplate)
    .then(() => {
      //
    })
    .catch((error) => {
      commonlib.errorlog(error);
    })
  }
}
