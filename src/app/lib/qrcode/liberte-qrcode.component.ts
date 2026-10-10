import { Component, OnInit, AfterViewChecked, OnDestroy, signal } from '@angular/core';
import { Observable, timer, takeWhile, Subscription } from 'rxjs';

import { QrcodeService, GENDERS } from './services/qrcode.service';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  imports: [FormsModule, QRCodeComponent],
  selector: 'lib-libert-qrcode',
  templateUrl: './liberte-qrcode.component.html',
  styleUrls: ['./liberte-qrcode.component.scss']
})
export class LiberteQRCode implements OnInit, AfterViewChecked, OnDestroy
{

  readonly qrcodevalue = signal("liberte");
  qrcodevaluejson: {};
  qrsize = 400;

  readonly shops = signal<any[]>([]);
  readonly _shop = signal<any>(null);

  genders = GENDERS;
  readonly _gender = signal<any>(null);

  readonly cartplatesitems = signal<any[]>([]);
  items: any[] = [];

  readonly filteredcartplatesitems = signal<any[]>([]);
  readonly filtereditems = signal<any[]>([]);

  readonly selectedcartplate = signal<any>(null);
  readonly selecteditem = signal<any>(null);
  beforeselecteditem: any | null = null;
  readonly selectedvariation = signal<any>(null);
  readonly needMatashita = signal(false);
  readonly showqrdlg = signal(false);

  readonly useExtension = signal(false);
  readonly selectedcartplateExtension1 = signal<any>(null);
  readonly selectedcartplateExtension2 = signal<any>(null);
  readonly selectedcartplateExtension3 = signal<any>(null);

  pantslengths50 =[
    {matashita: 50, caption:"50cm"},
    {matashita: 52, caption:"52cm"},
    {matashita: 54, caption:"54cm"},
    {matashita: 56, caption:"56cm"},
    {matashita: 58, caption:"58cm"},
  ]
  pantslengths60 =[
    {matashita: 60, caption:"60cm"},
    {matashita: 62, caption:"62cm"},
    {matashita: 64, caption:"64cm"},
    {matashita: 66, caption:"66cm"},
    {matashita: 68, caption:"68cm"},
  ]

  pantslengths70 =[
    {matashita: 70, caption:"70cm"},
    {matashita: 72, caption:"72cm"},
    {matashita: 74, caption:"74cm"},
    {matashita: 76, caption:"76cm"},
    {matashita: 78, caption:"78cm"},
  ]
  pantslengths80 =[
    {matashita: 80, caption:"80cm"},
    {matashita: 82, caption:"82cm"},
    {matashita: 84, caption:"84cm"},
    {matashita: 86, caption:"86cm"},
    {matashita: 88, caption:"88cm"},
  ]

  constructor(
    private qrsrv: QrcodeService,
  ) { }

  readonly locked = signal(false);

  confirmToggleLock():boolean {
    if (confirm("ロック設定を変更しますか？")) {
      if (this.locked()) {
        // 現在ロック中で解除される
        this.deselectAll(true);
      }
      return true;
    } else {
      return false;
    };
  }

  ngOnInit(): void {
    this.qrsrv.getshops().subscribe({
      next: (resp) => {
        this.shops.set(resp);
        console.log("shops:", this.shops());
      }
    });
    this.qrsrv.loaditem().then((resp) => {
      this.cartplatesitems.set(resp);
      console.log("cartplatesitems:", this.cartplatesitems());
    })
  }

  changeshop(shop){
    this._shop.set(shop);
    console.log("shop:", this._shop());
    if(this._shop()&&this._gender()){
      this.filtershopgender(this._shop().shop_id,this._gender().gender_id);
    }
  }

  changegender(gender: any){
    this._gender.set(gender);
    console.log("filtered:", this.filtereditems());
    if(this._shop()&&this._gender()){
      this.filtershopgender(this._shop().shop_id,this._gender().gender_id);
    }
  }

  filtershopgender(shop_id: string, gender_id: number){
    console.log(`shop_id:${shop_id} gender_id:${gender_id}`)
    const filteredcartplatesitems: any[] = [];
    for(const i in this.cartplatesitems()){
      const items: any[] = [];
      for(const j in this.cartplatesitems()[i].items){
        const genderexist = this.cartplatesitems()[i].items[j].genders.find(v => v.gender_id==gender_id);
        const shopexist = this.cartplatesitems()[i].items[j].shops.find(v => v.shop_id==shop_id);
        const showItem = this.cartplatesitems()[i].items[j].item_name.includes('修理') == false
        if(genderexist&&shopexist&&showItem){
          items.push(this.cartplatesitems()[i].items[j]);
        }
      }
      items.sort((a,b) => {
        if((!a.cartplate)&&(b.cartplate)) return 1;
        if(!b.cartplate) return -1;
        if(a.cartplate.ordinal > b.cartplate.ordinal) return 1;
        if(a.cartplate.ordinal < b.cartplate.ordinal) return -1;
        if(a.item_index > b.item_index) return 1;
        if(a.item_index < b.item_index) return -1;
        return 0;
      });
      filteredcartplatesitems.push({
        plate_id: this.cartplatesitems()[i].plate_id,
        caption: this.cartplatesitems()[i].caption,
        ordinal: this.cartplatesitems()[i].ordinal,
        genders: this.cartplatesitems()[i].genders,
        displayqrcode: this.cartplatesitems()[i].displayqrcode,
        items: items,
      });
    }
    this.filteredcartplatesitems.set(filteredcartplatesitems);
    this.selecteditem.set(null);
    this.selectedvariation.set(null);
    this.selectedcartplate.set(null);
    this.filtereditems.set([]);
  }


  judgeNeedMatashita() {
    if (this.selectedcartplate().caption == '制服（下）') {
      if (!!this.selecteditem() && this.selecteditem().item_name.includes('スカート')) {
        this.needMatashita.set(false);
      } else {
        this.needMatashita.set(true);
      }
    } else {
      this.needMatashita.set(false);
    }
  }

  changecart(cartplate: any){
    this.selectedcartplate.set(cartplate);
    console.log("selectedcartplate:", this.selectedcartplate());
    if (cartplate.caption.includes('ニット')) {
      this.separateForKnits(cartplate);
    } else if (this._gender()?.gender_id == 2 && cartplate.caption.includes('制服（下）')) {
      this.separateForGirlsUnder(cartplate);
    } else {
      this.useExtension.set(false);
    }
    if (this.selectedcartplate().items.length == 1) {
      this.selecteditem.set(this.selectedcartplate().items[0]);
    } else {
      this.selecteditem.set(null);
    }
    this.selectedvariation.set(null);
    this.judgeNeedMatashita();
  }

  private separateForGirlsUnder(cartplate: any) {
    this.useExtension.set(true);
    //1
    this.selectedcartplateExtension1.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension1().items = [];
    this.selectedcartplateExtension1().items.push(cartplate.items.find(item => item.item_name.includes('スカート') && item.item_name.includes('冬')));
    this.selectedcartplateExtension1().items.push(cartplate.items.find(item => item.item_name.includes('スカート') && item.item_name.includes('夏') && item.item_name.includes('チェック') == false));
    //2
    this.selectedcartplateExtension2.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension2().items = [];
    this.selectedcartplateExtension2().items.push({ item_id: "_void_item", item_name: "空枠", hide: 'hidden', width: '580px' });
    this.selectedcartplateExtension2().items.push(cartplate.items.find(item => item.item_name.includes('スカート') && item.item_name.includes('夏') && item.item_name.includes('チェック')));
    //3
    this.selectedcartplateExtension3.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension3().items = [];
    this.selectedcartplateExtension3().items.push(cartplate.items.find(item => item.item_name.includes('冬') && item.item_name.includes('スラックス')));
    this.selectedcartplateExtension3().items.push(cartplate.items.find(item => item.item_name.includes('夏') && item.item_name.includes('スラックス')));
  }

  private separateForKnits(cartplate: any) {
    this.useExtension.set(true);
    //1
    this.selectedcartplateExtension1.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension1().items = this.selectedcartplateExtension1().items.filter(item => item.item_name.includes('ベスト'));
    //2
    this.selectedcartplateExtension2.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension2().items = this.selectedcartplateExtension2().items.filter(item => item.item_name.includes('セーター'));
    //3
    this.selectedcartplateExtension3.set(Object.assign({}, cartplate));
    this.selectedcartplateExtension3().items = this.selectedcartplateExtension3().items.filter(item => item.item_name.includes('カーディガン'));
  }

  changeitem(item: any){
    this.selecteditem.set(item);
    this.selectedvariation.set(null);
    this.judgeNeedMatashita();
  }
  
  changevariation(variation: any){
    this.selectedvariation.set(variation);
    if (this.needMatashita() == false) {
      const value = {
        item_name: this.selecteditem().item_name,
        variation_name: this.selectedvariation().variation_name,
        item_id: this.selectedvariation().item_id,
        variation_id: this.selectedvariation().variation_id,
        price: this.selectedvariation().price,
        sku: this.selectedvariation().sku,
      }
      this.qrcodevalue.set(JSON.stringify(value));
      this.qrcodevaluejson = value;
      this.showqrdlg.set(true);
      this.runProgressBar();
    }
  }

  changematashita(pantslength: any){
    const value = {
      item_name: this.selecteditem().item_name,
      variation_name: this.selectedvariation().variation_name,
      item_id: this.selectedvariation().item_id,
      variation_id: this.selectedvariation().variation_id,
      price: this.selectedvariation().price,
      sku: this.selectedvariation().sku,
      matashita: pantslength.matashita,
    }
    this.qrcodevalue.set(JSON.stringify(value));
    this.qrcodevaluejson = value;
    this.showqrdlg.set(true);
    this.runProgressBar();
  }

  readonly progress = signal(0);
  countDown:Subscription;
  runProgressBar(){
    this.progress.set(0);
    this.countDown = timer(0,1200).subscribe(()=>{
      this.progress.set(this.progress()+1);
      if (this.progress() == 100) {
        this.closedlg();
        this.countDown.unsubscribe();
      }
    })
  }

  closedlg(){
    if (this.countDown) {
      this.countDown.unsubscribe();
    }
    this.deselectAll();
    this.showqrdlg.set(false);
    this.scrollToTop();
  }

  ngOnDestroy() {
    if (this.countDown) {
      this.countDown.unsubscribe();
      this.countDown = null;
    }
  }

  deselectAll(force=false){
    
    document.getElementsByName("matashita").forEach((element) => {
      (element as HTMLInputElement).checked = false;
    });
    document.getElementsByName("variation").forEach((element) => {
      (element as HTMLInputElement).checked = false;
    });
    document.getElementsByName("item").forEach((element) => {
      (element as HTMLInputElement).checked = false;
    });

    if (this.locked() == false || force) {
      document.getElementsByName("cartplate").forEach((element) => {
        (element as HTMLInputElement).checked = false;
      });
    
      document.getElementsByName("gender").forEach((element) => {
        (element as HTMLInputElement).checked = false;
      });
    
      document.getElementsByName("shop").forEach((element) => {
        (element as HTMLInputElement).checked = false;
      });
    }

    this.selectedvariation.set(null);
    
    
    if (force) {
      this.selecteditem.set(null);
    } else if (this.locked() == false) {
      this.selecteditem.set(null);
    } else if (this.selectedcartplate()?.items?.length > 1 ) {
      this.selecteditem.set(null);
    } else {
      // ロック中で１商品のみの商品カテゴリは解除しない
    }

    if (this.locked() == false || force) {
      this.filtereditems.set([]);
      this.selectedcartplate.set(null);
      this.filteredcartplatesitems.set([]);
      this._gender.set(null);
      this._shop.set(null);
    }
  }

  ngAfterViewChecked(): void {
    // 1カテゴリにたいして1商品しかない場合に強制的にチェックを付ける
    if (this.selectedcartplate() && this.selectedcartplate().items?.length == 1) {
      (document.getElementById("item" + this.selecteditem().item_id) as HTMLInputElement).checked = true;
    }
    // 股下を出す時は必ず最下部にスクロール
    if (this.selectedvariation() && this.needMatashita() && this.showqrdlg() == false) {
      this.scrollToBottom();
    }
    if (this.selecteditem() != this.beforeselecteditem && this.showqrdlg() == false) {
      this.beforeselecteditem = this.selecteditem();
      this.scrollToBottom();
    }
    if (this.showqrdlg()) {
      this.scrollToTop();
    }
  }

  scrollToBottom() {
    let divMatashita = document.getElementById("mostbottom");
    if (divMatashita) {
      console.log("scroll to bottom!");
      divMatashita.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  scrollToTop() {
    let bodyTop = document.getElementById("scrollable");
    console.log("scroll to top!");
    bodyTop.scrollIntoView({behavior:'smooth', block:'start'});
  }
}
