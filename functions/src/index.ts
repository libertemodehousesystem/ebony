import {setGlobalOptions} from "firebase-functions";

setGlobalOptions({maxInstances: 10});

export {getsquaretokenontailorv2, refreshtokenontailorv2} from "./token";
export {getsquarecategoriesontailorv2, getsquareitemsontailorv2, getsquarelocationsontailorv2} from "./catalog";
export {
  getsquarecustomerontailorv2,
  getsquarecustomerw3,
  updatesquarecustomerv2,
  bulkupdatesquarecustomerv2,
  setcustomerontailorv2,
} from "./customer";
export {calcorderonsontailorv2, setorderandpaymentontailorv2, refundontailorv2} from "./order";
export {getaddressv2} from "./address";
