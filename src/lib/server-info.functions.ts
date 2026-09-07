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
