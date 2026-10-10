import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "./lib/firebaseadmin";
import {requirerole, SUPER} from "./lib/auth";
import {bearerheaders, getsquaretoken, squarefetch, SquareToken} from "./lib/square";
import {tokyolongopt, tokyoopt} from "./options";

const getoffice = (request: {data: any}): string => {
  const office = request.data?.office;
  if (!office) {
    throw new HttpsError("invalid-argument", "error/office-required");
  }
  return office;
};

// Square カタログを cursor で最後まで取得
const listcatalog = async (params: SquareToken, type: "CATEGORY" | "ITEM"): Promise<any[]> => {
  const results: any[] = [];
  let cursor: string | undefined;
  do {
    const url = `${params.basepath}/v2/catalog/list?types=${type}` + (cursor ? `&cursor=${cursor}` : "");
    const resp = await squarefetch(url, {method: "GET", headers: bearerheaders("2021-09-15", params.access_token)});
    for (const object of resp.objects ?? []) {
      results.push(object);
    }
    cursor = resp.cursor;
  } while (cursor);
  return results;
};

export const getsquarecategoriesontailorv2 = onCall(tokyoopt, async (request) => {
  await requirerole(request, SUPER);
  const office = getoffice(request);
  const params = await getsquaretoken(office);
  const categories = await listcatalog(params, "CATEGORY");
  const linked_at = new Date().toISOString();
  for (const category of categories) {
    await admin.db().doc(`tailormeasure/${office}/squarecategories/${category.id}`).set({
      category_id: category.id,
      category_name: category.category_data.name,
      present_at_all_locations: category.present_at_all_locations,
      is_deleted: category.is_deleted,
      updated_at: category.updated_at,
      linked_at: linked_at,
    }, {merge: true});
  }
  return categories;
});

export const getsquareitemsontailorv2 = onCall(tokyolongopt, async (request) => {
  await requirerole(request, SUPER);
  const office = getoffice(request);
  const params = await getsquaretoken(office);
  const items = await listcatalog(params, "ITEM");
  const linked_at = new Date().toISOString();
  for (const item of items) {
    await admin.db().doc(`tailormeasure/${office}/squareitems/${item.id}`).set({
      item_id: item.id,
      item_name: item.item_data.name,
      category_id: item.item_data.category_id ?? null,
      label_color: item.item_data.label_color ?? null,
      description: item.item_data.description ?? null,
      present_at_all_locations: item.present_at_all_locations,
      present_at_location_ids: item.present_at_location_ids ?? null,
      is_deleted: item.is_deleted,
      updated_at: item.updated_at,
      linked_at: linked_at,
    }, {merge: true});
    for (const variation of item.item_data.variations ?? []) {
      const data = variation.item_variation_data;
      await admin.db().doc(`tailormeasure/${office}/squarevariations/${variation.id}`).set({
        variation_id: variation.id,
        variation_name: data.name,
        item_id: data.item_id,
        sku: data.sku ?? null,
        ordinal: data.ordinal ?? 0,
        price: data.price_money ? data.price_money.amount : 0,
        present_at_all_locations: variation.present_at_all_locations,
        present_at_location_ids: variation.present_at_location_ids ?? null,
        is_deleted: variation.is_deleted,
        updated_at: variation.updated_at,
        linked_at: linked_at,
      }, {merge: true});
    }
  }
  return items;
});

export const getsquarelocationsontailorv2 = onCall(tokyolongopt, async (request) => {
  await requirerole(request, SUPER);
  const office = getoffice(request);
  const params = await getsquaretoken(office);
  const resp = await squarefetch(`${params.basepath}/v2/locations`, {
    method: "GET",
    headers: bearerheaders("2025-10-16", params.access_token),
  });
  const locations: any[] = resp.locations ?? [];
  for (const location of locations) {
    await admin.db().doc(`tailormeasure/${office}/squarelocations/${location.id}`).set({
      location_id: location.id,
      location_name: location.name,
      isactive: false,
    }, {merge: true});
  }
  return locations;
});
