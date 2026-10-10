export interface EcSalesCategorizedCart {
    img: string;
    name: string;
    items: [];
    show_variation_name_only?:boolean;
}

export const GirlsMainCategories : EcSalesCategorizedCart[] = [
    {name: 'ポロシャツ',   img: '/assets/polos.png', items:[]},
    {name: '冬スカート',   img: '/assets/skirts.png', items:[], show_variation_name_only:true},
    {name: '夏スカート',   img: '/assets/skirts.png', items:[], show_variation_name_only:true},
    {name: '夏スカート・チェック', img: '/assets/skirts.png', items:[], show_variation_name_only:true},
    {name: '冬スラックス', img: '/assets/slacks.png', items:[], show_variation_name_only:true},
    {name: '夏スラックス', img: '/assets/slacks.png', items:[], show_variation_name_only:true},
    {name: '長袖ブラウス', img: '/assets/y-shirts.png', items:[], show_variation_name_only:true},
    {name: '半袖ブラウス', img: '/assets/short-shirts.png', items:[], show_variation_name_only:true},
    {name: '上着',        img: '/assets/jackets.png', items:[]}
];

export const BoysMainCategories : EcSalesCategorizedCart[] = [
    {name: '冬スラックス', img: '/assets/slacks.png', items:[], show_variation_name_only:true},
    {name: '夏スラックス', img: '/assets/slacks.png', items:[], show_variation_name_only:true},
    {name: '長袖シャツ',  img: '/assets/y-shirts.png', items:[], show_variation_name_only:true},
    {name: '半袖シャツ',  img: '/assets/short-shirts.png', items:[], show_variation_name_only:true},
    {name: '上着',        img: '/assets/suits.png', items:[]},
    {name: 'ポロシャツ',  img: '/assets/polos.png', items:[]}
];

export const BoysCommonCategories : EcSalesCategorizedCart[] = [
    {name: 'ネクタイ',                 img: '/assets/neckties.png', items:[]},
    {name: '小物（ネクタイピン・ベルト', img: '/assets/belt.png', items:[]},
    {name: '靴下',                     img: '/assets/socks.png', items:[]},
    {name: '革靴',                     img: '/assets/shoes.png', items:[]},
    {name: '二ット（カーディガン・セーター・ベスト）', img: '/assets/sweater.png', items:[]},
    {name: 'その他（ボタン・お直し）',   img: '/assets/buttons.png', items:[]},
];

export const GirlsCommonCategories : EcSalesCategorizedCart[] = [
    {name: 'ネクタイ・リボン',     img: '/assets/ribbons.png', items:[]},
    {name: '小物（ネクタイピン）', img: '/assets/tiepin.png', items:[]},
    {name: '靴下',                img: '/assets/socks.png', items:[]},
    {name: '革靴',                img: '/assets/shoes.png', items:[]},
    {name: '二ット（カーディガン・セーター・ベスト）', img: '/assets/sweater.png', items:[]},
    {name: 'その他（ボタン・お直し）',   img: '/assets/buttons.png', items:[]},
];