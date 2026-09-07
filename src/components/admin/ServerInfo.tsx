import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Loader2, RefreshCw, Server } from "lucide-react";

import { adminServerInfo } from "@/lib/server-info.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tableLabels: Record<string, string> = {
  companies: "الشركات",
  services: "الخدمات",
  projects: "المشاريع",
  products: "منتجات المتجر",
  gallery_images: "صور المكتبة",
  journey_events: "أحداث المسيرة",
  contact_messages: "رسائل التواصل",
  inquiries: "الطلبات",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export function ServerInfo() {
  const fetchInfo = useServerFn(adminServerInfo);
  const info = useQuery({ queryKey: ["server-info"], queryFn: () => fetchInfo() });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">تفاصيل الخادم</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void info.refetch()}
          disabled={info.isFetching}
        >
          {info.isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          تحديث
        </Button>
      </div>

      {info.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جارٍ جمع البيانات…
        </div>
      )}

      {info.isError && (
        <p className="text-sm text-destructive">تعذر جلب تفاصيل الخادم. حاول التحديث.</p>
      )}

      {info.data && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4" /> قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="اسم قاعدة البيانات" value={info.data.databaseName} />
              <Row label="مضيف قاعدة البيانات" value={info.data.databaseHost} />
              <Row label="نظام إدارة البيانات" value="PostgreSQL" />
              <Row label="آخر تحديث للمحتوى" value={formatDate(info.data.lastContentUpdate)} />
              <Row label="وقت هذا الفحص" value={formatDate(info.data.checkedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="size-4" /> آلية بناء التطبيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              {info.data.buildStack.map((item) => (
                <Row key={item.label} label={item.label} value={item.value} />
              ))}
              <Row label="بيئة التشغيل" value={info.data.runtime} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="size-4" /> حجم قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="الحجم المستخدم" value={formatBytes(info.data.usage.databaseBytes)} />
              <Row label="السعة المسموح بها" value={formatBytes(info.data.usage.databaseQuotaBytes)} />
              <Row
                label="نسبة الاستخدام"
                value={percent(info.data.usage.databaseBytes, info.data.usage.databaseQuotaBytes)}
              />
              <Meter used={info.data.usage.databaseBytes} total={info.data.usage.databaseQuotaBytes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="size-4" /> تخزين الصور والفيديوهات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="الحجم الكلي المستخدم" value={formatBytes(info.data.usage.storageTotalBytes)} />
              <Row label="السعة المسموح بها" value={formatBytes(info.data.usage.storageQuotaBytes)} />
              <Row
                label="الصور"
                value={`${formatBytes(info.data.usage.imageBytes)} • ${info.data.usage.imageCount} ملف`}
              />
              <Row
                label="الفيديوهات"
                value={`${formatBytes(info.data.usage.videoBytes)} • ${info.data.usage.videoCount} ملف`}
              />
              <Row label="ملفات أخرى" value={formatBytes(info.data.usage.otherBytes)} />
              <Row label="عدد الملفات الكلي" value={`${info.data.usage.objectCount} ملف`} />
              <Row
                label="أقصى حجم للملف الواحد"
                value={formatBytes(info.data.usage.fileSizeLimitBytes)}
              />
              <Meter
                used={info.data.usage.storageTotalBytes}
                total={info.data.usage.storageQuotaBytes}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">حجم البيانات</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 sm:grid-cols-2">
              {info.data.counts.map((row) => (
                <Row
                  key={row.table}
                  label={tableLabels[row.table] ?? row.table}
                  value={`${row.count} عنصر`}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
