import { Injectable } from '@angular/core';

import { FirestoreService } from '../../firestore.service';
import { lastValueFrom, map } from 'rxjs';

export const GENDERS = [
  {gender_id: 1, caption: "男性"},
  {gender_id: 2, caption: "女性"},
];

@Injectable({
  providedIn: 'root'
})
export class QrcodeService {

  private _office: string = "SHITATEKAN";


  constructor(
    private afstore: FirestoreService,
  ) { }

  getshops(){
    return this.afstore.collection(`/tailormeasure/${this._office}/shops`).get().pipe(
      map((shopsnap) => {
        const results = [];
        if(!shopsnap.empty){
          for(const i in shopsnap.docs){
            const doc = shopsnap.docs[i];
            results.push({
              shop_id: doc.get("shop_id"),
              shop_name: doc.get("shop_name"),
              created_at: doc.get("created_at"),
            })
          }
        }
        return results;
      })
    )
  }

  getqrcodecartplates(displayQr:boolean=true){
    return this.afstore.collection(`/tailormeasure/${this._office}/cartplates`).get().pipe(
      map((plateshot) => {
        const results = [];
        if(!plateshot.empty){
          for(const i in plateshot.docs){
            const doc = plateshot.docs[i];
            if(doc.get("displayqrcode") && displayQr || displayQr == false){
              results.push({
                plate_id: doc.get("plate_id"),
                caption: doc.get("caption"),
                ordinal: doc.get("ordinal"),
                genders: doc.get("genders"),
                displayqrcode: doc.get("displayqrcode"),
                items: [],
              })
            }
          }
        }
        results.sort((a,b) => {
          if(a.ordinal > b.ordinal) return 1;
          if(a.ordinal < b.ordinal) return -1;
          return 0;
        })
        return results;
      })
    )
  }

  getitems(cartplates: any[]){
    return this.afstore.collection(`/tailormeasure/${this._office}/items`).get().pipe(
      map((itemsnap) => {
        const results: any[] = [];
        if(!itemsnap.empty){
          for(const i in itemsnap.docs){
            const doc = itemsnap.docs[i];
            const cartplate = doc.get("cartplate") ? doc.get("cartplate") : null;
            if(cartplate){
              const addcartplate = this.seekcartplate(cartplates, cartplate.plate_id);
              if(addcartplate){
                let variations = doc.get("variations");
                let filterdVariations = [];
                for(const j in variations){
                  if (variations[j].candisplay == 'hidden' || variations[j].candisplay == 'none') {
                    continue;
                  } else {
                    filterdVariations.push(variations[j]);
                  }
                }
                addcartplate.items.push({
                  item_id: doc.get("item_id"),
                  item_name: doc.get("item_name"),
                  item_category_id: doc.get("item_category_id"),
                  item_color: doc.get("item_color"),
                  item_background_color: doc.get("item_background_color"),
                  item_index: doc.get("item_index"),
                  variations: filterdVariations,
                  showmeasuring: doc.get("showmeasuring"),
                  diffsizing: doc.get("diffsizing") ? doc.get("diffsizing") : false,
                  shops: doc.get("shops") ? doc.get("shops") : [],
                  genders: doc.get("genders") ? doc.get("genders") : [],
                  cartplate: doc.get("cartplate") ? doc.get("cartplate") : null,
                  created_at: doc.get("created_at"),
                });
                results.push({
                  item_id: doc.get("item_id"),
                  item_name: doc.get("item_name"),
                  item_category_id: doc.get("item_category_id"),
                  item_color: doc.get("item_color"),
                  item_background_color: doc.get("item_background_color"),
                  item_index: doc.get("item_index"),
                  variations: variations,
                  showmeasuring: doc.get("showmeasuring"),
                  diffsizing: doc.get("diffsizing") ? doc.get("diffsizing") : false,
                  shops: doc.get("shops") ? doc.get("shops") : [],
                  genders: doc.get("genders") ? doc.get("genders") : [],
                  cartplate: doc.get("cartplate") ? doc.get("cartplate") : null,
                  created_at: doc.get("created_at"),
                });
              }
            }
          }
        }
        return results;
      })
    )
  }

  seekcartplate(cartplates, plate_id){
    for(const i in cartplates){
      if(cartplates[i].plate_id==plate_id){
        return cartplates[i];
      }
    }
    return null;
  }

  async loaditem(displayQr:boolean=true){
    let results: any[] = [];
    await Promise.resolve()
    .then(() => {
      return lastValueFrom(this.getqrcodecartplates(displayQr));
    })
    .then((cartplates) => {
      results = cartplates;
      return lastValueFrom(this.getitems(results));
    })
    .then((items) => {
    })
    .catch((error) => {
      console.log("error:", error.message);
    })
    return results;
    //       // "EF63S2WCK3OWNH74YVR4S3VR","HJIS32ZGDEYVDYQQTAG7RY5L","IP2FRSO75U73LMB3RTH45OZE","J4YSMZZVMT7RZIOOR5Z4HDR3",
    //       // "B43HWYMGPQRGWQB4F2JEIT6A","MSGGRR7UBXZC5WBZLZT34DJK","QROBS3HMUNDW4EFWAIRMJG3X","VQGIGYQHG775R55F6GBRRG6Y"
    //           variations: variations,
  }
}
