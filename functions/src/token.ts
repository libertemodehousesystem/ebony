import {HttpsError, onCall} from "firebase-functions/v2/https";
import {requirerole, SUPER} from "./lib/auth";
import {getsquareaccess, gettokenontailor, settokenontailor, squarefetch} from "./lib/square";
import {tokyoopt} from "./options";

const oauthrequest = (basepath: string, body: object) => squarefetch(basepath + "/oauth2/token", {
  method: "POST",
  headers: {"Square-Version": "2020-12-16", "Content-Type": "application/json"},
  body: JSON.stringify(body),
});

export const getsquaretokenontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER);
  const {code, office} = request.data;
  if (!code || !office) {
    throw new HttpsError("invalid-argument", "error/code-and-office-required");
  }
  const sqaccess = await getsquareaccess();
  const resp = await oauthrequest(sqaccess.basepath, {
    client_id: sqaccess.client_id,
    client_secret: sqaccess.client_secret,
    grant_type: "authorization_code",
    code: code,
  });
  return settokenontailor(office, resp);
});

export const refreshtokenontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER);
  const {office} = request.data;
  if (!office) {
    throw new HttpsError("invalid-argument", "error/office-required");
  }
  const sqaccess = await getsquareaccess();
  const token = await gettokenontailor(sqaccess.basepath, office);
  const resp = await oauthrequest(sqaccess.basepath, {
    client_id: sqaccess.client_id,
    client_secret: sqaccess.client_secret,
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });
  return settokenontailor(office, resp);
});
