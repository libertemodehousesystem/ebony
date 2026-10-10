import {HttpsError, onCall} from "firebase-functions/v2/https";
import {requirerole, SUPER_OR_OPERATOR} from "./lib/auth";
import {squarefetch} from "./lib/square";
import {tokyoopt} from "./options";

// 郵便番号検索(外部サービス zipcloud)
export const getaddressv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER_OR_OPERATOR);
  const zipcode = request.data?.zipcode;
  if (!zipcode) {
    throw new HttpsError("invalid-argument", "error/zipcode-required");
  }
  return squarefetch("https://zipcloud.ibsnet.co.jp/api/search", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({zipcode: String(zipcode)}),
  });
});
