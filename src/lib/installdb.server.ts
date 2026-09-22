import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CopyTable = { table: string; conflict: string };

// FK-safe order: parents before children.
export const copyTables: CopyTable[] = [
  { table: "site_settings", conflict: "id" },
  { table: "page_settings", conflict: "page_key" },
  { table: "store_categories", conflict: "id" },
  { table: "companies", conflict: "id" },
  { table: "company_timeline", conflict: "id" },
  { table: "services", conflict: "id" },
  { table: "journey_events", conflict: "id" },
  { table: "projects", conflict: "id" },
  { table: "products", conflict: "id" },
  { table: "product_images", conflict: "id" },
  { table: "gallery_images", conflict: "id" },
  { table: "branches", conflict: "id" },
  { table: "restaurant_menu_items", conflict: "id" },
  { table: "inquiries", conflict: "id" },
  { table: "contact_messages", conflict: "id" },
];

function isOpaqueKey(key: string) {
  return key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
}

export function createTargetClient(url: string, key: string): SupabaseClient {
  return createClient(url.replace(/\/+$/, ""), key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isOpaqueKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export async function pingTarget(url: string, key: string) {
  const base = url.replace(/\/+$/, "");
  const started = Date.now();
  try {
    const res = await fetch(`${base}/rest/v1/`, { headers: { apikey: key } });
    return {
      ok: res.ok || res.status === 404,
      status: res.status,
      latencyMs: Date.now() - started,
      message: res.ok ? "تم الاتصال بنجاح" : `رمز الاستجابة ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      message: error instanceof Error ? error.message : "تعذر الوصول إلى الرابط",
    };
  }
}
