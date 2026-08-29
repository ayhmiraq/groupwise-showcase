import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  deleteRow,
  insertRow,
  listRows,
  updateRow,
  type AdminTable,
} from "./admin.server";

const tableSchema = z.enum([
  "site_settings",
  "page_settings",
  "companies",
  "company_timeline",
  "services",
  "journey_events",
  "projects",
  "store_categories",
  "products",
  "product_images",
  "inquiries",
  "contact_messages",
]);

const valuesSchema = z.record(z.string(), z.unknown());

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data), userId: context.userId };
  });

export const adminList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ table: tableSchema }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return listRows(context.supabase, data.table as AdminTable);
  });

export const adminInsert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ table: tableSchema, values: valuesSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return insertRow(context.supabase, data.table as AdminTable, data.values);
  });

export const adminUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        table: tableSchema,
        keyColumn: z.string().min(1).max(40),
        keyValue: z.union([z.string(), z.number()]),
        values: valuesSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return updateRow(
      context.supabase,
      data.table as AdminTable,
      data.keyColumn,
      data.keyValue,
      data.values,
    );
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        table: tableSchema,
        keyColumn: z.string().min(1).max(40),
        keyValue: z.union([z.string(), z.number()]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    return deleteRow(context.supabase, data.table as AdminTable, data.keyColumn, data.keyValue);
  });

export const adminUploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("expected_form_data");
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("missing_file");
    if (file.size > 100 * 1024 * 1024) throw new Error("file_too_large");
    return { file };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = data.file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from("media")
      .upload(path, data.file, { contentType: data.file.type || undefined, upsert: false });
    if (error) throw new Error(error.message);
    return { url: `/api/public/media/${path}` };
  });
