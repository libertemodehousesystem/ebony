import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import * as admin from "./firebaseadmin";

export type Role = "super" | "operator";

// Firebase Auth のログイン後、/userroles/tailormeasure/accounts/{uid} の role で制御する。
export const requirerole = async (request: CallableRequest, allowed: Role[]): Promise<string> => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "error/not-logged-in");
  }
  const doc = await admin.db().doc(`userroles/tailormeasure/accounts/${uid}`).get();
  const role = doc.exists ? doc.get("role") : null;
  if (!allowed.includes(role)) {
    throw new HttpsError("permission-denied", "error/role-not-allowed");
  }
  return uid;
};

export const SUPER: Role[] = ["super"];
export const SUPER_OR_OPERATOR: Role[] = ["super", "operator"];
