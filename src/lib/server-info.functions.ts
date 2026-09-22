import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, type AdminTable } from "./admin.server";

const countedTables: AdminTable[] = [
  "companies",
  "services",
  "projects",
  "products",
  "gallery_images",
  "journey_events",
  "contact_messages",
  "inquiries",
];

const buildStack = [
  { label: "لغة البرمجة", value: "TypeScript / React 19" },
  { label: "إطار العمل", value: "TanStack Start v1 (SSR)" },
  { label: "أداة البناء", value: "Vite 8" },
  { label: "التنسيق والتصميم", value: "Tailwind CSS 4 + shadcn/ui" },
  { label: "إدارة البيانات", value: "TanStack Query 5" },
  { label: "نوع قاعدة البيانات", value: "PostgreSQL" },
  { label: "خدمة الخادم", value: "بيئة سحابية بلا خوادم (Edge)" },
  { label: "التخزين", value: "حاوية الوسائط media" },
];

// السعة الافتراضية لخطة الاستضافة (قابلة للترقية)
const DB_QUOTA_BYTES = 8 * 1024 ** 3;
const STORAGE_QUOTA_BYTES = 100 * 1024 ** 3;

export const adminServerInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const counts: { table: string; count: number }[] = [];
    let lastUpdate: string | null = null;

    for (const table of countedTables) {
      const { count } = await context.supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      counts.push({ table, count: count ?? 0 });

      const { data } = await context.supabase
        .from(table)
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      const created = (data?.[0] as { created_at?: string } | undefined)?.created_at;
      if (created && (!lastUpdate || created > lastUpdate)) lastUpdate = created;
    }

    const { data: settings } = await context.supabase
      .from("site_settings")
      .select("updated_at")
      .limit(1);
    const settingsUpdated = (settings?.[0] as { updated_at?: string | null } | undefined)
      ?.updated_at;
    if (settingsUpdated && (!lastUpdate || settingsUpdated > lastUpdate)) {
      lastUpdate = settingsUpdated;
    }

    const { data: usageRaw } = await context.supabase.rpc("admin_usage_stats" as never);
    const usageData = (usageRaw ?? {}) as Record<string, number | null>;
    const num = (key: string) => Number(usageData[key] ?? 0);

    const usage = {
      databaseBytes: num("database_bytes"),
      databaseQuotaBytes: DB_QUOTA_BYTES,
      storageTotalBytes: num("storage_total_bytes"),
      storageQuotaBytes: STORAGE_QUOTA_BYTES,
      imageBytes: num("image_bytes"),
      videoBytes: num("video_bytes"),
      otherBytes: num("other_bytes"),
      imageCount: num("image_count"),
      videoCount: num("video_count"),
      objectCount: num("object_count"),
      fileSizeLimitBytes: num("file_size_limit"),
    };

    return {
      databaseName: "postgres",
      databaseHost: new URL(process.env["VITE_SUPABASE_URL"] ?? "https://localhost").hostname,
      runtime: `Node ${process.versions?.node ?? "—"}`,
      buildStack,
      counts,
      usage,
      lastContentUpdate: lastUpdate,
      checkedAt: new Date().toISOString(),
    };
  });

export const adminDatabaseBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase.rpc("admin_export_database" as never);
    if (error) throw new Error(error.message);

    const sql = (data as unknown as string) ?? "";
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return { sql, filename: `backup-${stamp}.sql`, bytes: sql.length };
  });

type StorageManifest = {
  buckets: {
    id: string;
    name: string;
    public: boolean;
    file_size_limit: number | null;
    allowed_mime_types: string[] | null;
  }[];
  objects: { bucket: string; name: string; size: number | null; mimetype: string | null }[];
};

export const adminStorageExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase.rpc("admin_storage_manifest" as never);
    if (error) throw new Error(error.message);
    const manifest = (data as unknown as StorageManifest) ?? { buckets: [], objects: [] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const lines: string[] = [
      "#!/usr/bin/env bash",
      "# سكربت نقل ملفات التخزين إلى Supabase Self-Hosted",
      "# 1) نفّذ هذا السكربت لتنزيل كل الملفات داخل مجلد media-export",
      "# 2) عدّل NEW_URL و NEW_SERVICE_KEY ثم أزل التعليق عن قسم الرفع",
      "set -euo pipefail",
      "",
      'NEW_URL="https://supabase.example.com"',
      'NEW_SERVICE_KEY="service-role-key"',
      "",
      "# --- إنشاء الحاويات في القاعدة الجديدة ---",
    ];

    for (const bucket of manifest.buckets) {
      lines.push(
        `curl -s -X POST "$NEW_URL/storage/v1/bucket" -H "Authorization: Bearer $NEW_SERVICE_KEY" -H "Content-Type: application/json" -d '${JSON.stringify(
          {
            name: bucket.name,
            id: bucket.id,
            public: bucket.public,
            file_size_limit: bucket.file_size_limit,
            allowed_mime_types: bucket.allowed_mime_types,
          },
        )}' || true`,
      );
    }

    lines.push("", "# --- تنزيل الملفات ثم رفعها ---");

    let signed = 0;
    for (const object of manifest.objects) {
      const { data: urlData } = await supabaseAdmin.storage
        .from(object.bucket)
        .createSignedUrl(object.name, 60 * 60 * 24 * 7);
      const url = urlData?.signedUrl;
      if (!url) continue;
      signed += 1;
      const local = `media-export/${object.bucket}/${object.name}`;
      lines.push(`mkdir -p "$(dirname '${local}')"`);
      lines.push(`curl -fsSL -o '${local}' '${url}'`);
      lines.push(
        `curl -s -X POST "$NEW_URL/storage/v1/object/${object.bucket}/${object.name}" -H "Authorization: Bearer $NEW_SERVICE_KEY" -H "Content-Type: ${
          object.mimetype ?? "application/octet-stream"
        }" --data-binary @'${local}' > /dev/null`,
      );
    }

    lines.push("", 'echo "تم نقل الملفات"');

    const script = lines.join("\n");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const totalBytes = manifest.objects.reduce((sum, item) => sum + (item.size ?? 0), 0);

    return {
      script,
      filename: `storage-migrate-${stamp}.sh`,
      buckets: manifest.buckets.length,
      files: manifest.objects.length,
      signed,
      totalBytes,
    };
  });
