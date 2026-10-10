import {HttpsError} from "firebase-functions/v2/https";
import * as admin from "./firebaseadmin";

export interface SquareParams {
  basepath: string;
  accesstoken: string;
  client_id: string;
  client_secret: string;
}

export interface SquareToken {
  basepath: string;
  access_token: string;
  expires_at: string;
  merchant_id: string;
  refresh_token: string;
  short_lived: boolean;
  token_type: string;
  location_id: string | null;
  location_name: string | null;
}

// Square REST を呼んで JSON を返す(v1 の sendreq.fetchparsejson 相当)
export const squarefetch = async (url: string, options: RequestInit): Promise<any> => {
  const response = await fetch(url, options);
  return response.json();
};

export const bearerheaders = (version: string, accesstoken: string) => ({
  "Square-Version": version,
  "Authorization": "Bearer " + accesstoken,
  "Content-Type": "application/json",
});

export const getsquareaccess = async (): Promise<SquareParams> => {
  const doc = await admin.db().doc("tailormeasure/access/").get();
  const data = doc.data();
  if (!doc.exists || !data) {
    throw new HttpsError("failed-precondition", "error/no-access-parameter");
  }
  return {
    basepath: data.basepath,
    accesstoken: data.access_token,
    client_id: data.client_id,
    client_secret: data.client_secret,
  };
};

export const gettokenontailor = async (basepath: string, office: string): Promise<SquareToken> => {
  const doc = await admin.db().doc(`tailormeasure/${office}`).get();
  const data = doc.data();
  if (!doc.exists || !data) {
    throw new HttpsError("failed-precondition", "error/no-token-data");
  }
  if (!data.access_token) {
    throw new HttpsError("failed-precondition", "error/no-accesstoken");
  }
  return {
    basepath: basepath,
    access_token: data.access_token,
    expires_at: data.expires_at,
    merchant_id: data.merchant_id,
    refresh_token: data.refresh_token,
    short_lived: data.short_lived,
    token_type: data.token_type,
    location_id: data.location_id ? data.location_id : null,
    location_name: data.location_name ? data.location_name : null,
  };
};

// アクセス情報と事業所のトークンをまとめて取得
export const getsquaretoken = async (office: string): Promise<SquareToken> => {
  const sqaccess = await getsquareaccess();
  return gettokenontailor(sqaccess.basepath, office);
};

export const settokenontailor = async (office: string, data: any) => {
  if (!data.message) {
    await admin.db().doc(`tailormeasure/${office}`).set({
      access_token: data.access_token,
      expires_at: data.expires_at,
      merchant_id: data.merchant_id,
      refresh_token: data.refresh_token,
      short_lived: data.short_lived,
      token_type: data.Authorizationtoken_type ? data.Authorizationtoken_type : "bearer",
    }, {merge: true});
  }
  return data;
};
