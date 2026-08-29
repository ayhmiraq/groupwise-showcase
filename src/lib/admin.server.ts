import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

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
): Promise<unknown[]> {
  const order = orderBy[table] ?? { column: "created_at", ascending: false };
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(order.column, { ascending: order.ascending });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertRow(
  supabase: SupabaseClient<Database>,
  table: AdminTable,
  values: Record<string, unknown>,
) {
  const { error } = await supabase.from(table).insert(values as never);
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
    .update(values as never)
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
