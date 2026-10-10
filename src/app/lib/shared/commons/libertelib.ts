export function errorlog(error: Error){
  console.log("error:",error.message);
}

export function sleep(milisec: number){
  return new Promise(resolve => setTimeout(resolve, milisec));
}

// 0埋め処理
export function zeroPadding(value:number,length:number){
  return ('0000000000' + value).slice(-length);
}
// 左0をスペース埋め処理
export function spacePadding(value:number,length:number){
  return ('         ' + value).slice(-length);
}

// YYYYY-MM-DDをYYYY年MM月DD日 HH:MI:SSに変換
export function convertJPfull(value:string){
  return `${value.substring(0,4)}年${zeroPadding(Number(value.substring(5,7)),2)}月${zeroPadding(Number(value.substring(8,10)),2)}日 ${zeroPadding(Number(value.substring(11,13)),2)}:${zeroPadding(Number(value.substring(14,16)),2)}:${zeroPadding(Number(value.substring(17,19)),2)}`;
}

// YYYYY-MM-DDをYYYY年MM月DD日（月） HH:MI:SSに変換
export function convertJPfullww(value:string,week:string){
  return `${value.substring(0,4)}年${zeroPadding(Number(value.substring(5,7)),2)}月${zeroPadding(Number(value.substring(8,10)),2)}日(${week}) ${zeroPadding(Number(value.substring(11,13)),2)}:${zeroPadding(Number(value.substring(14,16)),2)}:${zeroPadding(Number(value.substring(17,19)),2)}`;
}

// YYYYY-MM-DDをYYYY年MM月DD日に変換
export function convertJP(value:string){
  return `${value.substring(0,4)}年${zeroPadding(Number(value.substring(5,7)),2)}月${zeroPadding(Number(value.substring(8,10)),2)}日`;
}

export function convertJPv2(value:string){
  return `${value.substring(0,4)}年${spacePadding(Number(value.substring(5,7)), 2)}月${spacePadding(Number(value.substring(8,10)), 2)}日`;
}

// YYYY-MM-DDをDD日に変換
export function convertJPDate(value:string){
  return `${zeroPadding(Number(value.substring(8,10)),2)}日`;
}

// YYYY-MM-DDをYYYY年MM月に変換
export function convertJPMonth(value:string){
  return `${value.substring(0,4)}年${zeroPadding(Number(value.substring(5,7)),2)}月`;
}

// YYYYY-MM-DDをMM月DD日に変換
export function convertJPMonthDate(value:string){
  return `${zeroPadding(Number(value.substring(5,7)),2)}月${zeroPadding(Number(value.substring(8,10)),2)}日`;
}

// YYYYY-MM-DDをMM/DDに変換
export function convertMonthDate(value:string){
  return `${Number(value.substring(5,7))}/${Number(value.substring(8,10))}`;
}

// 現在時間を数字で表現
export function timefornumberstring(){
  const now = new Date();
  const result = zeroPadding(now.getFullYear(),4)
               + zeroPadding(now.getMonth(),2)
               + zeroPadding(now.getDate(),2)
               + zeroPadding(now.getHours(),2)
               + zeroPadding(now.getMinutes(),2)
               + zeroPadding(now.getSeconds(),2);
  return result;
}

// YYYYY-MM-DDをMM/DDに変換
export function convertJPShortMonthDate(value:string){
  return `${Number(value.substring(5,7))}/${Number(value.substring(8,10))}`;
}

// カンマ区切り金額表示
export function currencyJP(value: number){
  return Math.floor(value).toLocaleString();
}

//月末取得
export function getendofmonth(year:number,month:number){
  switch(month){
    case 1:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 2:
      if(year % 4 == 0){
        return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-29";
      }
      else{
        return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-28";
      }
    case 3:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 4:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-30";
    case 5:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 6:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-30";
    case 7:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 8:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 9:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-30";
    case 10:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    case 11:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-30";
    case 12:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
    default:
      return zeroPadding(year,4)+"-"+zeroPadding(month,2)+"-31";
  }
}

//月末取得（月日表示）
export function getendofmonthmonthdata(value:number){
  switch(value){
    case 1:
      return zeroPadding(value,2)+"-31";
    case 2:
      if(value % 4 == 0){
        return zeroPadding(value,2)+"-29";
      }
      else{
        return zeroPadding(value,2)+"-28";
      }
    case 3:
      return zeroPadding(value,2)+"-31";
    case 4:
      return zeroPadding(value,2)+"-30";
    case 5:
      return zeroPadding(value,2)+"-31";
    case 6:
      return zeroPadding(value,2)+"-30";
    case 7:
      return zeroPadding(value,2)+"-31";
    case 8:
      return zeroPadding(value,2)+"-31";
    case 9:
      return zeroPadding(value,2)+"-30";
    case 10:
      return zeroPadding(value,2)+"-31";
    case 11:
      return zeroPadding(value,2)+"-30";
    case 12:
      return zeroPadding(value,2)+"-31";
    default:
      return zeroPadding(value,2)+"-31";
  }
}

// 当月末日に移動
export function moveLastDate(value:Date){
  value.setMonth(value.getMonth() + 1);
  value.setDate(1);
  value.setDate(value.getDate() - 1);
  return value;
}

// 金額表現
export function convertYen(value:Number){
  return value.toLocaleString();
}

// 漢字チェック
export function kanjicheck(value: string){
  const kanzireg = /([\u{3005}\u{3007}\u{303b}\u{3400}-\u{9FFF}\u{F900}-\u{FAFF}\u{20000}-\u{2FFFF}][\u{E0100}-\u{E01EF}\u{FE00}-\u{FE02}]?)/mu;
  return kanzireg.test(value);
}

// ひらがなチェック
export function hiracheck(value: string){
  const hirareg = /[\u{3000}-\u{301C}\u{3041}-\u{3093}\u{309B}-\u{309E}]/mu;
  return hirareg.test(value);
}

// カタカナチェック
export function kanacheck(value: string){
  const kanareg = /[\u{3000}-\u{301C}\u{30A1}-\u{30F6}\u{30FB}-\u{30FE}]/mu;
  return kanareg.test(value);
}

// 半角カナ→全角カナ変換
const ankanaMap = new Map();

function generateh2ZMap(){
  if(ankanaMap.size==0){
    ankanaMap.set('ｶﾞ', 'ガ');
    ankanaMap.set('ｷﾞ', 'ギ');
    ankanaMap.set('ｸﾞ', 'グ');
    ankanaMap.set('ｹﾞ', 'ゲ');
    ankanaMap.set('ｺﾞ', 'ゴ');
    ankanaMap.set('ｻﾞ', 'ザ');
    ankanaMap.set('ｼﾞ', 'ジ');
    ankanaMap.set('ｽﾞ', 'ズ');
    ankanaMap.set('ｾﾞ', 'ゼ');
    ankanaMap.set('ｿﾞ', 'ゾ');
    ankanaMap.set('ﾀﾞ', 'ダ');
    ankanaMap.set('ﾁﾞ', 'ヂ');
    ankanaMap.set('ﾂﾞ', 'ヅ');
    ankanaMap.set('ﾃﾞ', 'デ');
    ankanaMap.set('ﾄﾞ', 'ド');
    ankanaMap.set('ﾊﾞ', 'バ');
    ankanaMap.set('ﾋﾞ', 'ビ');
    ankanaMap.set('ﾌﾞ', 'ブ');
    ankanaMap.set('ﾍﾞ', 'ベ');
    ankanaMap.set('ﾎﾞ', 'ボ');
    ankanaMap.set('ﾊﾟ', 'パ');
    ankanaMap.set('ﾋﾟ', 'ピ');
    ankanaMap.set('ﾌﾟ', 'プ');
    ankanaMap.set('ﾍﾟ', 'ペ');
    ankanaMap.set('ﾎﾟ', 'ポ');
    ankanaMap.set('ｳﾞ', 'ヴ');
    ankanaMap.set('ﾜﾞ', 'ヷ');
    ankanaMap.set('ｦﾞ', 'ヺ');
    ankanaMap.set('カ゛', 'ガ');
    ankanaMap.set('キ゛', 'ギ');
    ankanaMap.set('ク゛', 'グ');
    ankanaMap.set('ケ゛', 'ゲ');
    ankanaMap.set('コ゛', 'ゴ');
    ankanaMap.set('サ゛', 'ザ');
    ankanaMap.set('シ゛', 'ジ');
    ankanaMap.set('ス゛', 'ズ');
    ankanaMap.set('セ゛', 'ゼ');
    ankanaMap.set('ソ゛', 'ゾ');
    ankanaMap.set('タ゛', 'ダ');
    ankanaMap.set('チ゛', 'ヂ');
    ankanaMap.set('ツ゛', 'ヅ');
    ankanaMap.set('テ゛', 'デ');
    ankanaMap.set('ト゛', 'ド');
    ankanaMap.set('ハ゛', 'バ');
    ankanaMap.set('ヒ゛', 'ビ');
    ankanaMap.set('フ゛', 'ブ');
    ankanaMap.set('ヘ゛', 'ベ');
    ankanaMap.set('ホ゛', 'ボ');
    ankanaMap.set('ハ゜', 'パ');
    ankanaMap.set('ヒ゜', 'ピ');
    ankanaMap.set('フ゜', 'プ');
    ankanaMap.set('ヘ゜', 'ペ');
    ankanaMap.set('ホ゜', 'ポ');
    ankanaMap.set('ウ゛', 'ヴ');
    ankanaMap.set('ワ゛', 'ヷ');
    ankanaMap.set('ヲ゛', 'ヺ');
    ankanaMap.set('ｱ', 'ア');
    ankanaMap.set('ｲ', 'イ');
    ankanaMap.set('ｳ', 'ウ');
    ankanaMap.set('ｴ', 'エ');
    ankanaMap.set('ｵ', 'オ');
    ankanaMap.set('ｶ', 'カ');
    ankanaMap.set('ｷ', 'キ');
    ankanaMap.set('ｸ', 'ク');
    ankanaMap.set('ｹ', 'ケ');
    ankanaMap.set('ｺ', 'コ');
    ankanaMap.set('ｻ', 'サ');
    ankanaMap.set('ｼ', 'シ');
    ankanaMap.set('ｽ', 'ス');
    ankanaMap.set('ｾ', 'セ');
    ankanaMap.set('ｿ', 'ソ');
    ankanaMap.set('ﾀ', 'タ');
    ankanaMap.set('ﾁ', 'チ');
    ankanaMap.set('ﾂ', 'ツ');
    ankanaMap.set('ﾃ', 'テ');
    ankanaMap.set('ﾄ', 'ト');
    ankanaMap.set('ﾅ', 'ナ');
    ankanaMap.set('ﾆ', 'ニ');
    ankanaMap.set('ﾇ', 'ヌ');
    ankanaMap.set('ﾈ', 'ネ');
    ankanaMap.set('ﾉ', 'ノ');
    ankanaMap.set('ﾊ', 'ハ');
    ankanaMap.set('ﾋ', 'ヒ');
    ankanaMap.set('ﾌ', 'フ');
    ankanaMap.set('ﾍ', 'ヘ');
    ankanaMap.set('ﾎ', 'ホ');
    ankanaMap.set('ﾏ', 'マ');
    ankanaMap.set('ﾐ', 'ミ');
    ankanaMap.set('ﾑ', 'ム');
    ankanaMap.set('ﾒ', 'メ');
    ankanaMap.set('ﾓ', 'モ');
    ankanaMap.set('ﾔ', 'ヤ');
    ankanaMap.set('ﾕ', 'ユ');
    ankanaMap.set('ﾖ', 'ヨ');
    ankanaMap.set('ﾗ', 'ラ');
    ankanaMap.set('ﾘ', 'リ');
    ankanaMap.set('ﾙ', 'ル');
    ankanaMap.set('ﾚ', 'レ');
    ankanaMap.set('ﾛ', 'ロ');
    ankanaMap.set('ﾜ', 'ワ');
    ankanaMap.set('ｦ', 'ヲ');
    ankanaMap.set('ﾝ', 'ン');
    ankanaMap.set('ｧ', 'ァ');
    ankanaMap.set('ｨ', 'ィ');
    ankanaMap.set('ｩ', 'ゥ');
    ankanaMap.set('ｪ', 'ェ');
    ankanaMap.set('ｫ', 'ォ');
    ankanaMap.set( 'ｯ', 'ッ');
    ankanaMap.set('ｬ', 'ャ');
    ankanaMap.set('ｭ', 'ュ');
    ankanaMap.set('ｮ', 'ョ');
    ankanaMap.set( '｡', '。');
    ankanaMap.set('､', '、');
    ankanaMap.set('ｰ', 'ー');
    ankanaMap.set('｢', '「');
    ankanaMap.set('｣', '」');
    ankanaMap.set('･', '・');
  }
}

export function hankana2Zenkana(str: string) {
  if(!str) return "";
  generateh2ZMap();
  // var ankanaMap = {
  //     'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
  //     'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
  //     'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
  //     'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
  //     'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
  //     'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
  //     'カ゛': 'ガ', 'キ゛': 'ギ', 'ク゛': 'グ', 'ケ゛': 'ゲ', 'コ゛': 'ゴ',
  //     'サ゛': 'ザ', 'シ゛': 'ジ', 'ス゛': 'ズ', 'セ゛': 'ゼ', 'ソ゛': 'ゾ',
  //     'タ゛': 'ダ', 'チ゛': 'ヂ', 'ツ゛': 'ヅ', 'テ゛': 'デ', 'ト゛': 'ド',
  //     'ハ゛': 'バ', 'ヒ゛': 'ビ', 'フ゛': 'ブ', 'ヘ゛': 'ベ', 'ホ゛': 'ボ',
  //     'ハ゜': 'パ', 'ヒ゜': 'ピ', 'フ゜': 'プ', 'ヘ゜': 'ペ', 'ホ゜': 'ポ',
  //     'ウ゛': 'ヴ', 'ワ゛': 'ヷ', 'ヲ゛': 'ヺ',
  //     'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
  //     'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  //     'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
  //     'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  //     'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
  //     'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  //     'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
  //     'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  //     'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
  //     'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
  //     'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
  //     'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
  //     '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
  // };

  var reg = new RegExp('(' + Array.from(ankanaMap.keys()).join('|') + ')', 'g');
  // console.log("reg:",reg);
  return str.replace(reg,
    function (match: string) {
      const result = ankanaMap.get(match);
      return result;
      // return ankanaMap[match];
    }).replace(/ﾞ/g, '゛').replace(/ﾟ/g, '゜');
};

// ひらがなカタカナ変換
export function hiraToKana(str: string) {
  return str.replace(/[\u3041-\u3096]/g, function(match) {
      var chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
  });
}

const hirakanamatrix = [
  ["あ","ア"], ["い","イ"], ["う","ウ"], ["え","エ"], ["お","オ"],
  ["ぁ","ァ"], ["ぃ","ィ"], ["ぅ","ゥ"], ["ぇ","ェ"], ["ぉ","ォ"],
  ["か","カ"], ["き","キ"], ["く","ク"], ["け","ケ"], ["こ","コ"],
  ["が","ガ"], ["ぎ","ギ"], ["ぐ","グ"], ["げ","ゲ"], ["ご","ゴ"],
  ["さ","サ"], ["し","シ"], ["す","ス"], ["せ","セ"], ["そ","ソ"],
  ["ざ","ザ"], ["じ","ジ"], ["ず","ズ"], ["ぜ","ゼ"], ["ぞ","ゾ"],
  ["た","タ"], ["ち","チ"], ["つ","ツ"], ["て","テ"], ["と","ト"],
  ["だ","ダ"], ["ぢ","ヂ"], ["づ","ヅ"], ["で","デ"], ["ど","ド"],
  ["な","ナ"], ["に","二"], ["ぬ","ヌ"], ["ね","ネ"], ["の","ノ"],
  ["は","ハ"], ["ひ","ヒ"], ["ふ","フ"], ["へ","ヘ"], ["ほ","ホ"],
  ["ば","バ"], ["び","ビ"], ["ぶ","ブ"], ["べ","ベ"], ["ぼ","ボ"],
  ["ぱ","パ"], ["ぴ","ピ"], ["ぷ","プ"], ["ぺ","ペ"], ["ぽ","ポ"],
  ["ま","マ"], ["み","ミ"], ["む","ム"], ["め","メ"], ["も","モ"],
  ["や","ヤ"], ["ゐ","ヰ"], ["ゆ","ユ"], ["ゑ","ヱ"], ["よ","ヨ"],
  ["ゃ","ャ"], ["ゅ","ュ"], ["ょ","ョ"],
  ["ら","ラ"], ["り","リ"], ["る","ル"], ["れ","レ"], ["ろ","ロ"],
  ["わ","ワ"], ["を","ヲ"], ["ん","ン"],
]

// 平仮名カタカナ変換
export function hiratokana(value:string):string {
  const result = hirakanamatrix.find(v => v[0]==value);
  if(result){
    return result[1];
  }
  return value;
  // return value.replace(/[\u3041-\u3096]/g, function(match) {
  //   var chr = match.charCodeAt(0) + 0x60;
  //   return String.fromCharCode(chr);
  // });
}

// カタカナ平仮名変換
export function kanatohira(value:string):string {
  return value.replace(/[\u30A1-\u30FA]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

export const statesJP = [
  { state_id:"01",state_caption:"北海道" },
  { state_id:"02",state_caption:"青森県" },
  { state_id:"03",state_caption:"岩手県" },
  { state_id:"04",state_caption:"宮城県" },
  { state_id:"05",state_caption:"秋田県" },
  { state_id:"06",state_caption:"山形県" },
  { state_id:"07",state_caption:"福島県" },
  { state_id:"08",state_caption:"茨城県" },
  { state_id:"09",state_caption:"栃木県" },
  { state_id:"10",state_caption:"群馬県" },
  { state_id:"11",state_caption:"埼玉県" },
  { state_id:"12",state_caption:"千葉県" },
  { state_id:"13",state_caption:"東京都" },
  { state_id:"14",state_caption:"神奈川県" },
  { state_id:"15",state_caption:"新潟県" },
  { state_id:"16",state_caption:"富山県" },
  { state_id:"17",state_caption:"石川県" },
  { state_id:"18",state_caption:"福井県" },
  { state_id:"19",state_caption:"山梨県" },
  { state_id:"20",state_caption:"長野県" },
  { state_id:"21",state_caption:"岐阜県" },
  { state_id:"22",state_caption:"静岡県" },
  { state_id:"23",state_caption:"愛知県" },
  { state_id:"24",state_caption:"三重県" },
  { state_id:"25",state_caption:"滋賀県" },
  { state_id:"26",state_caption:"京都府" },
  { state_id:"27",state_caption:"大阪府" },
  { state_id:"28",state_caption:"兵庫県" },
  { state_id:"29",state_caption:"奈良県" },
  { state_id:"30",state_caption:"和歌山県" },
  { state_id:"31",state_caption:"鳥取県" },
  { state_id:"32",state_caption:"島根県" },
  { state_id:"33",state_caption:"岡山県" },
  { state_id:"34",state_caption:"広島県" },
  { state_id:"35",state_caption:"山口県" },
  { state_id:"36",state_caption:"徳島県" },
  { state_id:"37",state_caption:"香川県" },
  { state_id:"38",state_caption:"愛媛県" },
  { state_id:"39",state_caption:"高知県" },
  { state_id:"40",state_caption:"福岡県" },
  { state_id:"41",state_caption:"佐賀県" },
  { state_id:"42",state_caption:"長崎県" },
  { state_id:"43",state_caption:"熊本県" },
  { state_id:"44",state_caption:"大分県" },
  { state_id:"45",state_caption:"宮崎県" },
  { state_id:"46",state_caption:"鹿児島県" },
  { state_id:"47",state_caption:"沖縄県" },
];

// UIDを生成する関数
export function generateUid() {
  let chars = "xxxxxxxxxxxxxxxxxxxxxxxx".split("");
  for (let i = 0, len = chars.length; i < len; i++) {
      switch (chars[i]) {
          case "x":
              chars[i] = Math.floor(Math.random() * 16).toString(16);
              break;
          case "y":
              chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
              break;
      }
  }
  return chars.join("");
}

export function forceDebugUserMailByEnvironment(production:boolean, email:string) {
  if (production) {
    return email;
  }
  return "dev@shitatekan.co.jp";
}

export function getEnvironmentalBccAddresses(production:boolean) {
  if (production) {
    return [{"email":"systeminfo@liberte-mode.co.jp"}, {"email":"dev@shitatekan.co.jp"}, {"email":"libertemode1616@gmail.com"}];
  }
  return [{"email":"tk.cw.milds@gmail.com"}, {"email":"tkmilds@hotmail.com"}, {"email":"hasegawa-t@impact-dx-lab.works"}];
}