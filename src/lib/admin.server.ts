import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AdminRow = Record<string, JsonValue>;

export type AdminTable =
  | "site_settings"
  | "page_settings"
  | "companies"
  | "company_timeline"
  | "services"
  | "journey_events"
  | "projects"
  | "store_categories"
  | "products"
  | "product_images"
  | "inquiries"
  | "contact_messages";

export async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("forbidden");
}

const orderBy: Record<string, { column: string; ascending: boolean }> = {
  site_settings: { column: "id", ascending: true },
  page_settings: { column: "page_key", ascending: true },
  companies: { column: "sort_order", ascending: true },
  company_timeline: { column: "event_date", ascending: true },
  services: { column: "sort_order", ascending: true },
  journey_events: { column: "event_date", ascending: true },
  projects: { column: "sort_order", ascending: true },
  store_categories: { column: "sort_order", ascending: true },
  products: { column: "sort_order", ascending: true },
  product_images: { column: "sort_order", ascending: true },
  inquiries: { column: "created_at", ascending: false },
  contact_messages: { column: "created_at", ascending: false },
};

export async function listRows(
  supabase: SupabaseClient<Database>,
  table: AdminTable,
): Promise<AdminRow[]> {
  const order = orderBy[table] ?? { column: "created_at", ascending: false };
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(order.column, { ascending: order.ascending });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminRow[];
}

// Columns that are genuinely nullable in the schema; every other null becomes ""
// so NOT NULL text columns with a '' default never receive an explicit null.
const nullableColumns = new Set([
  "image_url",
  "bg_url",
  "youtube_id",
  "tile_bg_url",
  "tile_youtube_id",
  "page_bg_url",
  "page_youtube_id",
  "page_image_url",
  "link_url",
  "logo_url",
  "founded_date",
  "opening_date",
  "start_date",
  "end_date",
  "event_date",
  "price",
  "category_id",
  "company_id",
  "product_id",
  "phone",
  "email",
  "topbar_text_ar",
  "topbar_text_en",
  "address_ar",
  "address_en",
  "whatsapp",
  "facebook",
  "instagram",
  "linkedin",
  "youtube",
  "footer_note_ar",
  "footer_note_en",
  "caption_ar",
  "caption_en",
  "updated_at",
]);

// Numeric columns that are NOT NULL with defaults: an empty value must be
// omitted entirely so the column default / existing value is kept.
function isNumericColumn(key: string): boolean {
  return /(_order|overlay|price|quantity)$/.test(key) || /^fx_(density|speed|hue|glow)$/.test(key);
}

// Columns that are never text: an empty string must become null, not ''.
function isNonTextColumn(key: string): boolean {
  return /(_at|_date|_id|_url)$/.test(key) || isNumericColumn(key);
}

function sanitizeValues(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const empty = value === "" || value === null || value === undefined;
    if (empty && isNumericColumn(key)) {
      continue; // let the column default / current value stand
    }
    if (value === null && !nullableColumns.has(key) && !isNonTextColumn(key)) {
      out[key] = "";
    } else if (value === "") {
      // empty string on non-text columns (dates, numbers, uuids) breaks inserts
      out[key] = nullableColumns.has(key) || isNonTextColumn(key) ? null : value;
    } else {
      out[key] = value;
    }
  }
  return out;
}


export async function insertRow(
  supabase: SupabaseClient<Database>,
  table: AdminTable,
  values: Record<string, unknown>,
) {
  const { error } = await supabase.from(table).insert(sanitizeValues(values) as never);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateRow(
  supabase: SupabaseClient<Database>,
  table: AdminTable,
  keyColumn: string,
  keyValue: string | number,
  values: Record<string, unknown>,
) {
  const { error } = await supabase
    .from(table)
    .update(sanitizeValues(values) as never)
    .eq(keyColumn, keyValue as never);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteRow(
  supabase: SupabaseClient<Database>,
  table: AdminTable,
  keyColumn: string,
  keyValue: string | number,
) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq(keyColumn, keyValue as never);
  if (error) throw new Error(error.message);
  return { ok: true };
}
