import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Database,
  Download,
  Loader2,
  Plug,
  RefreshCw,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { adminIsAdmin } from "@/lib/admin.functions";
import { adminDatabaseBackup, adminStorageExport } from "@/lib/server-info.functions";
import {
  installdbCopyData,
  installdbDeleteTarget,
  installdbListTargets,
  installdbSaveTarget,
  installdbSchemaSql,
  installdbSourceStatus,
  installdbTestTarget,
} from "@/lib/installdb.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/installdb")({
  head: () => ({
    meta: [
      { title: "تثبيت قاعدة بيانات بديلة | لوحة التحكم" },
      {
        name: "description",
        content: "تثبيت قاعدة بيانات جديدة ونسخ محتويات القاعدة الحالية إليها مع متابعة حالة الاتصال.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "تثبيت قاعدة بيانات بديلة" },
      { property: "og:description", content: "استبدال قاعدة البيانات ونسخ المحتوى بالكامل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InstallDbPage,
});

type FormState = {
  id?: string;
  label: string;
  supabaseUrl: string;
  serviceKey: string;
  anonKey: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  label: "",
  supabaseUrl: "",
  serviceKey: "",
  anonKey: "",
  notes: "",
  isActive: false,
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar", { dateStyle: "long", timeStyle: "short" });
}

function InstallDbPage() {
  const checkAdmin = useServerFn(adminIsAdmin);
  const roleQuery = useQuery({ queryKey: ["admin-role"], queryFn: () => checkAdmin() });

  const listTargets = useServerFn(installdbListTargets);
  const sourceStatus = useServerFn(installdbSourceStatus);
  const saveTarget = useServerFn(installdbSaveTarget);
  const deleteTarget = useServerFn(installdbDeleteTarget);
  const testTarget = useServerFn(installdbTestTarget);
  const copyData = useServerFn(installdbCopyData);
  const schemaSql = useServerFn(installdbSchemaSql);
  const fullBackup = useServerFn(adminDatabaseBackup);
  const storageExport = useServerFn(adminStorageExport);

  const enabled = roleQuery.data?.isAdmin === true;
  const targets = useQuery({
    queryKey: ["installdb-targets"],
    queryFn: () => listTargets(),
    enabled,
  });
  const source = useQuery({
    queryKey: ["installdb-source"],
    queryFn: () => sourceStatus(),
    enabled,
  });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);
  const [exportingStorage, setExportingStorage] = useState(false);
  const [storageInfo, setStorageInfo] = useState<
    { files: number; buckets: number; totalBytes: number } | null
  >(null);
  const [testResult, setTestResult] = useState<
    { id: string; ok: boolean; message: string; tablesReady: number; missing: string[] } | null
  >(null);
  const [copyResult, setCopyResult] = useState<
    { totalCopied: number; failed: number; results: { table: string; copied: number; error: string | null }[] } | null
  >(null);

  if (roleQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> جارٍ التحقق من الصلاحيات…
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-xl font-bold">هذه الصفحة للمدير فقط</h1>
        <Button variant="secondary" asChild>
          <Link to="/">عودة للموقع</Link>
        </Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!form.label.trim() || !form.supabaseUrl.trim() || (!form.id && !form.serviceKey.trim())) {
      toast.error("أكمل الاسم والرابط ومفتاح الخدمة");
      return;
    }
    setSaving(true);
    try {
      await saveTarget({
        data: {
          ...(form.id ? { id: form.id } : {}),
          label: form.label,
          supabaseUrl: form.supabaseUrl,
          serviceKey: form.serviceKey,
          anonKey: form.anonKey,
          notes: form.notes,
          isActive: form.isActive,
        },
      });
      setForm(emptyForm);
      await targets.refetch();
      toast.success("تم حفظ بيانات القاعدة");
    } catch {
      toast.error("تعذر الحفظ، تحقق من البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setBusyId(id);
    try {
      const result = await testTarget({ data: { id } });
      setTestResult({
        id,
        ok: result.ok,
        message: result.message,
        tablesReady: result.tablesReady,
        missing: result.missing,
      });
      await targets.refetch();
      if (result.ok) toast.success("تم الاتصال بالقاعدة الجديدة");
      else toast.error("فشل الاتصال بالقاعدة الجديدة");
    } catch {
      toast.error("تعذر اختبار الاتصال");
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = async (id: string) => {
    setBusyId(id);
    try {
      const result = await copyData({ data: { id } });
      setCopyResult(result);
      await targets.refetch();
      if (result.failed) toast.warning("تم النسخ مع بعض الأخطاء، راجع التفاصيل");
      else toast.success(`تم نسخ ${result.totalCopied} صفاً إلى القاعدة الجديدة`);
    } catch {
      toast.error("تعذر نسخ البيانات");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteTarget({ data: { id } });
      await targets.refetch();
      toast.success("تم حذف القاعدة من القائمة");
    } catch {
      toast.error("تعذر الحذف");
    } finally {
      setBusyId(null);
    }
  };

  const downloadText = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSchema = async () => {
    setDownloading(true);
    try {
      const result = await schemaSql();
      downloadText(result.sql, result.filename, "application/sql;charset=utf-8");
      toast.success("تم تنزيل ملف التثبيت");
    } catch {
      toast.error("تعذر إنشاء ملف التثبيت");
    } finally {
      setDownloading(false);
    }
  };

  const handleFullExport = async () => {
    setExportingFull(true);
    try {
      const result = await fullBackup();
      downloadText(result.sql, result.filename, "application/sql;charset=utf-8");
      toast.success("تم تنزيل النسخة الشاملة");
    } catch {
      toast.error("تعذر إنشاء النسخة الشاملة");
    } finally {
      setExportingFull(false);
    }
  };

  const handleStorageExport = async () => {
    setExportingStorage(true);
    try {
      const result = await storageExport();
      downloadText(result.script, result.filename, "text/x-shellscript;charset=utf-8");
      setStorageInfo({
        files: result.files,
        buckets: result.buckets,
        totalBytes: result.totalBytes,
      });
      toast.success(`تم إنشاء سكربت نقل ${result.files} ملفاً`);
    } catch {
      toast.error("تعذر إنشاء سكربت نقل الملفات");
    } finally {
      setExportingStorage(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-lg font-bold">تثبيت واستبدال قاعدة البيانات</h1>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin">عودة للوحة التحكم</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Database className="size-4" /> حالة القاعدة الحالية (المرتبطة بتحديثات Lovable)
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void source.refetch()}
                disabled={source.isFetching}
              >
                {source.isFetching ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                تحديث
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {source.isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> جارٍ فحص الاتصال…
              </p>
            )}
            {source.isError && <p className="text-sm text-destructive">تعذر فحص القاعدة الحالية.</p>}
            {source.data && (
              <>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                    <CheckCircle2 className="size-4" /> متصل
                  </span>
                  <span className="text-muted-foreground">المضيف: {source.data.host}</span>
                  <span className="text-muted-foreground">زمن الاستجابة: {source.data.latencyMs} م.ث</span>
                  <span className="text-muted-foreground">
                    إجمالي الصفوف: {source.data.totalRows}
                  </span>
                </div>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {source.data.tables.map((row) => (
                    <div
                      key={row.table}
                      className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">{row.table}</span>
                      <span className="font-medium">{row.count}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  آخر فحص: {formatDate(source.data.checkedAt)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4" /> الخطوة الأولى: تثبيت البنية في القاعدة الجديدة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              نزّل ملف SQL يحتوي بنية كل الجداول وبياناتها، ثم نفّذه مرة واحدة في القاعدة الجديدة
              بالأمر <code className="rounded bg-muted px-1">psql -f install-db.sql</code> أو من محرر
              SQL. بعدها يمكنك النسخ التلقائي المتكرر من الأسفل.
            </p>
            <Button onClick={() => void handleSchema()} disabled={downloading}>
              {downloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              تنزيل ملف التثبيت
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {form.id ? "تعديل قاعدة بيانات" : "إضافة قاعدة بيانات جديدة"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم القاعدة</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="قاعدة الاستضافة الذاتية"
                />
              </div>
              <div className="space-y-2">
                <Label>رابط القاعدة (Supabase URL)</Label>
                <Input
                  value={form.supabaseUrl}
                  onChange={(e) => setForm({ ...form, supabaseUrl: e.target.value })}
                  placeholder="https://db.example.com"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>مفتاح الخدمة (Service Role Key)</Label>
                <Input
                  type="password"
                  value={form.serviceKey}
                  onChange={(e) => setForm({ ...form, serviceKey: e.target.value })}
                  placeholder={form.id ? "اتركه فارغاً للإبقاء على المفتاح الحالي" : "service key"}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>المفتاح العام (اختياري)</Label>
                <Input
                  type="password"
                  value={form.anonKey}
                  onChange={(e) => setForm({ ...form, anonKey: e.target.value })}
                  placeholder="anon / publishable key"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              اعتبارها القاعدة البديلة المعتمدة
            </label>
            <div className="flex gap-2">
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />} حفظ
              </Button>
              {form.id && (
                <Button variant="ghost" onClick={() => setForm(emptyForm)}>
                  إلغاء
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">قواعد البيانات المسجلة</h2>
          {targets.isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> جارٍ التحميل…
            </p>
          )}
          {targets.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">لم تُضف أي قاعدة بيانات بديلة بعد.</p>
          )}
          {targets.data?.map((target) => (
            <Card key={target.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>
                    {target.label || "قاعدة بدون اسم"}
                    {target.is_active && (
                      <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        معتمدة
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                    {target.supabase_url}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-x-6 text-sm sm:grid-cols-2">
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">الحالة</span>
                    <span className="font-medium">{target.last_status ?? "—"}</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">آخر اختبار</span>
                    <span className="font-medium">{formatDate(target.last_tested_at)}</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">آخر نسخ</span>
                    <span className="font-medium">{formatDate(target.last_copy_at)}</span>
                  </div>
                  <div className="flex justify-between border-b py-2">
                    <span className="text-muted-foreground">مفتاح الخدمة</span>
                    <span className="font-medium" dir="ltr">
                      {target.service_key || "—"}
                    </span>
                  </div>
                </div>

                {testResult?.id === target.id && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      {testResult.ok ? (
                        <CheckCircle2 className="size-4 text-primary" />
                      ) : (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      {testResult.message}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      الجداول الجاهزة: {testResult.tablesReady}
                      {testResult.missing.length > 0 && ` • جداول ناقصة: ${testResult.missing.join("، ")}`}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleTest(target.id)}
                    disabled={busyId === target.id}
                  >
                    {busyId === target.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plug className="size-4" />
                    )}
                    اختبار الاتصال
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleCopy(target.id)}
                    disabled={busyId === target.id}
                  >
                    {busyId === target.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Database className="size-4" />
                    )}
                    نسخ المحتوى إلى هذه القاعدة
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setForm({
                        id: target.id,
                        label: target.label ?? "",
                        supabaseUrl: target.supabase_url ?? "",
                        serviceKey: "",
                        anonKey: "",
                        notes: target.notes ?? "",
                        isActive: target.is_active ?? false,
                      })
                    }
                  >
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => void handleDelete(target.id)}
                    disabled={busyId === target.id}
                  >
                    <Trash2 className="size-4" /> حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {copyResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">نتيجة آخر عملية نسخ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                إجمالي الصفوف المنسوخة: <strong>{copyResult.totalCopied}</strong>
                {copyResult.failed > 0 && ` • جداول بها أخطاء: ${copyResult.failed}`}
              </p>
              <div className="grid gap-x-6 sm:grid-cols-2">
                {copyResult.results.map((row) => (
                  <div
                    key={row.table}
                    className="flex items-center justify-between border-b py-2 text-sm last:border-b-0"
                  >
                    <span className="text-muted-foreground">{row.table}</span>
                    <span className={row.error ? "font-medium text-destructive" : "font-medium"}>
                      {row.error ? row.error : `${row.copied} صف`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الربط بالتحديثات المستقبلية عبر Lovable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              تبقى القاعدة الحالية هي المصدر الذي يستقبل تحديثات وبنى الجداول الجديدة من Lovable.
              بعد كل تحديث كبير: نزّل ملف التثبيت لتحديث بنية القاعدة الجديدة، ثم اضغط «نسخ المحتوى»
              لمزامنة البيانات إليها.
            </p>
            <p>
              النسخ يعمل بالتحديث والإضافة (Upsert) على المفتاح الأساسي، لذا يمكن تكراره بأمان دون
              تكرار الصفوف.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
