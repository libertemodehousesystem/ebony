import {HttpsError, onCall} from "firebase-functions/v2/https";
import {requirerole, SUPER, SUPER_OR_OPERATOR} from "./lib/auth";
import {bearerheaders, getsquaretoken, squarefetch, SquareToken} from "./lib/square";
import {tokyolongopt, tokyoopt} from "./options";

interface UpdateCustomerAddress {
  id: string;
  address: {
    address_line_1?: string;
    address_line_2?: string;
    address_line_3?: string;
    country?: string;
    postal_code?: string;
  };
}

const getoffice = (request: {data: any}): string => {
  const office = request.data?.office;
  if (!office) {
    throw new HttpsError("invalid-argument", "error/office-required");
  }
  return office;
};

// address_line_3 を持つ顧客のみ返す
const customersrequest = async (params: SquareToken) => {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const url = `${params.basepath}/v2/customers?limit=100` + (cursor ? `&cursor=${cursor}` : "");
    const resp = await squarefetch(url, {method: "GET", headers: bearerheaders("2026-01-22", params.access_token)});
    for (const customer of resp.customers ?? []) {
      if (customer.address && customer.address.address_line_3) {
        results.push(customer);
      }
    }
    cursor = resp.cursor;
  } while (cursor);
  return results;
};

const customeraddressbulkupdate = (params: SquareToken, requestbody: object) => fetch(
  `${params.basepath}/v2/customers/bulk-update`,
  {
    method: "POST",
    headers: bearerheaders("2026-01-22", params.access_token),
    body: JSON.stringify({customers: requestbody}),
  });

export const getsquarecustomerontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER);
  const params = await getsquaretoken(getoffice(request));
  return customersrequest(params);
});

export const getsquarecustomerw3 = onCall(tokyolongopt, async (request) => {
  await requirerole(request, SUPER);
  const params = await getsquaretoken(getoffice(request));
  return customersrequest(params);
});

// 移行元(bizcommon functions-ts)では Square への PUT がコメントアウトされた状態で、
// リクエストボディを返すだけだった。挙動をそのまま引き継いでいる。
export const updatesquarecustomerv2 = onCall(tokyolongopt, async (request) => {
  await requirerole(request, SUPER);
  await getsquaretoken(getoffice(request));
  const customeraddress: UpdateCustomerAddress = request.data.customeraddress;
  return {body: JSON.stringify({address: customeraddress.address})};
});

export const bulkupdatesquarecustomerv2 = onCall(tokyolongopt, async (request) => {
  await requirerole(request, SUPER);
  const params = await getsquaretoken(getoffice(request));
  const customers: UpdateCustomerAddress[] = [...(request.data.customeraddresses ?? [])];
  let reqcustomers: Record<string, unknown> = {};
  let reqcount = 0;
  let totalcount = 0;
  // Square の bulk-update は 100 件ずつ
  for (const customer of customers) {
    reqcustomers[customer.id] = {address: customer.address};
    reqcount++;
    totalcount++;
    if (reqcount >= 100) {
      const response = await customeraddressbulkupdate(params, reqcustomers);
      console.log("response status:", response.status);
      reqcount = 0;
      reqcustomers = {};
    }
  }
  if (reqcount > 0) {
    const response = await customeraddressbulkupdate(params, reqcustomers);
    console.log("response status:", response.status);
  }
  return {status: "SUCCESS", totalcount: totalcount};
});

export const setcustomerontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER_OR_OPERATOR);
  const params = await getsquaretoken(getoffice(request));
  const customer = request.data.customer;
  if (!customer) {
    throw new HttpsError("invalid-argument", "error/customer-required");
  }
  const address: Record<string, string> = {country: customer.country};
  if (customer.address1) address["address_line_1"] = customer.address1;
  if (customer.address2) address["address_line_2"] = customer.address2;
  if (customer.address3) address["address_line_3"] = customer.address3;
  if (customer.postal_code) address["postal_code"] = customer.postal_code;
  const resp = await squarefetch(`${params.basepath}/v2/customers`, {
    method: "POST",
    headers: bearerheaders("2022-01-20", params.access_token),
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      given_name: customer.given_name,
      family_name: customer.family_name,
      email_address: customer.email_address,
      phone_number: customer.phone_number,
      address: address,
      note: customer.note,
      reference_id: customer.reference_id,
    }),
  });
  return resp.customer ?? resp;
});
