import {HttpsError, onCall} from "firebase-functions/v2/https";
import {requirerole, SUPER_OR_OPERATOR} from "./lib/auth";
import {bearerheaders, getsquaretoken, squarefetch, SquareToken} from "./lib/square";
import {tokyoopt} from "./options";

const getoffice = (request: {data: any}): string => {
  const office = request.data?.office;
  if (!office) {
    throw new HttpsError("invalid-argument", "error/office-required");
  }
  return office;
};

const tax = {
  name: "消費税",
  uid: "consumption_tax",
  type: "ADDITIVE",
  scope: "LINE_ITEM",
  percentage: "10",
};

const post = (url: string, version: string, params: SquareToken, body: object) => squarefetch(url, {
  method: "POST",
  headers: bearerheaders(version, params.access_token),
  body: JSON.stringify(body),
});

export const calcorderonsontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER_OR_OPERATOR);
  const {customer_uid, lineitems} = request.data;
  if (!customer_uid) {
    throw new HttpsError("invalid-argument", "error/customer-uid-required");
  }
  const params = await getsquaretoken(getoffice(request));
  if (!params.location_id) {
    return {error: "location-is-null"};
  }
  return post(`${params.basepath}/v2/orders/calculate`, "2021-09-15", params, {
    order: {
      location_id: params.location_id,
      customer_id: customer_uid,
      taxes: [tax],
      line_items: lineitems,
    },
  });
});

export const setorderandpaymentontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER_OR_OPERATOR);
  const {paymethod, order} = request.data;
  if (paymethod !== "CASH" && paymethod !== "EXTERNAL") {
    throw new HttpsError("invalid-argument", "error/paymethod-is-not-cash-or-external");
  }
  if (!order) {
    throw new HttpsError("invalid-argument", "error/order-required");
  }
  const params = await getsquaretoken(getoffice(request));
  if (!params.location_id) {
    return {error: "location-is-null"};
  }
  const resorder = await post(`${params.basepath}/v2/orders`, "2021-10-20", params, {
    idempotency_key: crypto.randomUUID(),
    order: {
      reference_id: order.reference_id,
      location_id: params.location_id,
      customer_id: order.square_customer_uid,
      taxes: [tax],
      line_items: order.line_items,
    },
  });
  if (!resorder.order?.id) {
    return resorder;
  }
  const common = {
    idempotency_key: crypto.randomUUID(),
    customer_id: order.square_customer_uid,
    order_id: resorder.order.id,
    amount_money: {currency: "JPY", amount: order.total_money},
    location_id: params.location_id,
    reference_id: order.reference_id,
  };
  const payment = paymethod === "EXTERNAL" ?
    {
      ...common,
      source_id: "EXTERNAL",
      external_details: {source: "HOSEIHANBAI", source_id: "EXTERNAL", type: "OTHER"},
      note: order.customer_name ? order.customer_name + "（振込）" : "振込",
    } :
    {
      ...common,
      source_id: "CASH",
      cash_details: {
        buyer_supplied_money: {amount: order.receive_money, currency: "JPY"},
        change_back_money: {amount: order.change_money, currency: "JPY"},
      },
      note: order.customer_name ? order.customer_name + "（現金）" : "現金",
    };
  return post(`${params.basepath}/v2/payments`, "2022-01-20", params, payment);
});

export const refundontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER_OR_OPERATOR);
  const {payment_id, amount_money} = request.data;
  if (!payment_id) {
    throw new HttpsError("invalid-argument", "error/payment-id-required");
  }
  const params = await getsquaretoken(getoffice(request));
  return post(`${params.basepath}/v2/refunds`, "2022-01-20", params, {
    amount_money: {amount: amount_money, currency: "JPY"},
    payment_id: payment_id,
    idempotency_key: crypto.randomUUID(),
    reason: "販売会アプリから払い戻し",
  });
});
