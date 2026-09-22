import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin.server";

type TargetInput = {
  id?: string;
  label: string;
  supabaseUrl: string;
  serviceKey: string;
  anonKey?: string;
  notes?: string;
  isActive?: boolean;
};

export const installdbListTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("db_targets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      ...row,
      service_key: row.service_key ? `${row.service_key.slice(0, 10)}••••••` : "",
      anon_key: row.anon_key ? `${row.anon_key.slice(0, 10)}••••••` : null,
    }));
  });

export const installdbSaveTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TargetInput) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const payload: Record<string, unknown> = {
      label: data.label.trim(),
      supabase_url: data.supabaseUrl.trim().replace(/\/+$/, ""),
      notes: data.notes?.trim() || null,
      is_active: data.isActive ?? false,
    };
    if (data.serviceKey.trim()) payload["service_key"] = data.serviceKey.trim();
    if (data.anonKey?.trim()) payload["anon_key"] = data.anonKey.trim();

    if (data.id) {
      const { error } = await context.supabase
        .from("db_targets")
        .update(payload as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("db_targets")
      .insert(payload as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: (inserted as { id: string }).id };
  });

export const installdbDeleteTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("db_targets").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** حالة الاتصال بالقاعدة الحالية (القديمة) المرتبطة بتحديثات Lovable */
export const installdbSourceStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { copyTables } = await import("./installdb.server");
    const started = Date.now();
    const tables: { table: string; count: number }[] = [];
    for (const item of copyTables) {
      const { count } = await context.supabase
        .from(item.table as never)
        .select("*", { count: "exact", head: true });
      tables.push({ table: item.table, count: count ?? 0 });
    }
    return {
      connected: true,
      host: new URL(process.env["SUPABASE_URL"] ?? "https://localhost").hostname,
      latencyMs: Date.now() - started,
      totalRows: tables.reduce((sum, row) => sum + row.count, 0),
      tables,
      checkedAt: new Date().toISOString(),
    };
  });

export const installdbTestTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: target, error } = await context.supabase
      .from("db_targets")
      .select("supabase_url, service_key")
      .eq("id", data.id)
      .single();
    if (error || !target) throw new Error("لم يتم العثور على القاعدة");

    const { pingTarget, createTargetClient, copyTables } = await import("./installdb.server");
    const row = target as { supabase_url: string; service_key: string };
    const ping = await pingTarget(row.supabase_url, row.service_key);

    let tablesReady = 0;
    const missing: string[] = [];
    if (ping.ok) {
      const client = createTargetClient(row.supabase_url, row.service_key);
      for (const item of copyTables) {
        const { error: tableError } = await client
          .from(item.table)
          .select("*", { count: "exact", head: true });
        if (tableError) missing.push(item.table);
        else tablesReady += 1;
      }
    }

    await context.supabase
      .from("db_targets")
      .update({
        last_status: ping.ok ? (missing.length ? "جداول ناقصة" : "متصل وجاهز") : "فشل الاتصال",
        last_tested_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id);

    return { ...ping, tablesReady, missing };
  });

/** ملف SQL كامل (بنية + بيانات) لتثبيته في القاعدة الجديدة */
export const installdbSchemaSql = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.rpc("admin_export_database" as never);
    if (error) throw new Error(error.message);
    const sql = (data as unknown as string) ?? "";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return { sql, filename: `install-db-${stamp}.sql`, bytes: sql.length };
  });

/** نسخ محتويات القاعدة القديمة إلى القاعدة الجديدة */
export const installdbCopyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: target, error } = await context.supabase
      .from("db_targets")
      .select("supabase_url, service_key")
      .eq("id", data.id)
      .single();
    if (error || !target) throw new Error("لم يتم العثور على القاعدة");

    const { createTargetClient, copyTables } = await import("./installdb.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = target as { supabase_url: string; service_key: string };
    const client = createTargetClient(row.supabase_url, row.service_key);

    const results: { table: string; copied: number; error: string | null }[] = [];
    for (const item of copyTables) {
      const { data: rows, error: readError } = await supabaseAdmin
        .from(item.table as never)
        .select("*");
      if (readError) {
        results.push({ table: item.table, copied: 0, error: readError.message });
        continue;
      }
      const list = (rows ?? []) as Record<string, unknown>[];
      if (!list.length) {
        results.push({ table: item.table, copied: 0, error: null });
        continue;
      }
      let copied = 0;
      let lastError: string | null = null;
      for (let i = 0; i < list.length; i += 200) {
        const chunk = list.slice(i, i + 200);
        const { error: writeError } = await client
          .from(item.table)
          .upsert(chunk, { onConflict: item.conflict });
        if (writeError) lastError = writeError.message;
        else copied += chunk.length;
      }
      results.push({ table: item.table, copied, error: lastError });
    }

    const failed = results.filter((r) => r.error).length;
    await context.supabase
      .from("db_targets")
      .update({
        last_copy_at: new Date().toISOString(),
        last_status: failed ? "نسخ جزئي" : "تم النسخ بنجاح",
      } as never)
      .eq("id", data.id);

    return {
      results,
      totalCopied: results.reduce((sum, r) => sum + r.copied, 0),
      failed,
      finishedAt: new Date().toISOString(),
    };
  });
