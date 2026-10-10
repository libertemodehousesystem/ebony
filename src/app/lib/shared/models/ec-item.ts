//冗長だが購入履歴表示の読込ロジックの簡素化を優先
export interface EcItem {
    //スクエアの値
    id:string;
    name:string;
    category_id: string;
    category_name: string;
    description: string;
    ordinal? : number;
    variations : EcVariation[];//購入してcustomer以下にsnapshotとして保存される際には1つにする
    is_deleted? :boolean;
    //サイト上のみの値
    ec_name?: string;
    ec_invisible?: boolean;
    ec_ordinal?: number;
    ec_variation_title?: string;
    ec_custom_text_usage?: boolean;
    ec_custom_text_title?: string;
    ec_custom_text_min?: number;
    ec_custom_text_max?: number;
    ec_variation_separated_prefix_title?: string;
    ec_variation_separated_suffix_title?: string;
    ec_photos?: EcPhoto[];
    ec_edited_user_id?: string;
    ec_edited_date?: Date;
    ec_explanation?: string;
    ec_short_explanation?: string;
    ec_hide_size_chart?: boolean;
    ec_wear_type_key?: string;
    //顧客入力の値
    ec_custom_text_value?: string;
    //販売会専用
    ec_sales_comment? : string;
    ec_sales_category_girls? : string;
    ec_sales_category_boys? : string;
    ec_sales_item_name_short? : string;
}

//属性値追加時の修正箇所
//item-detail.component.ts
export interface EcVariation {
    id:string;
    name:string;
    price:string;
    ordinal:number;
    is_deleted? :boolean;
    ec_price_with_tax?:string;
    ec_invisible?:boolean;
}

export interface EcPhoto {
    id?:string; //クライアント作成時には空。Firestoreで埋める。
    file?:any;
    name?:string;
    url: string | ArrayBuffer;
    ordinal: number;
    changed?:boolean;//未変更のものは保存ロジックをスキップさせる
    created_user?:string;
    created_date?:Date;//
    is_deleted? :boolean;//現状未使用
}
