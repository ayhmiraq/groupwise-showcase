import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { adminDelete, adminInsert, adminList, adminUpdate } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaInput } from "./MediaInput";
import { sections, type Field, type SectionConfig } from "./fields";

type Row = Record<string, unknown>;

function initialForm(config: SectionConfig, row?: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of config.fields) {
    const raw = row?.[f.name];
    if (f.type === "boolean") out[f.name] = raw === undefined ? true : Boolean(raw);
    else out[f.name] = raw === null || raw === undefined ? "" : String(raw);
  }
  return out;
}

function toPayload(config: SectionConfig, form: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of config.fields) {
    const raw = form[f.name];
    if (f.type === "boolean") out[f.name] = Boolean(raw);
    else if (f.type === "number") out[f.name] = raw === "" ? null : Number(raw);
    else out[f.name] = raw === "" ? null : raw;
  }
  return out;
}

function useOptionRows(source: Field["optionsFrom"]) {
  const list = useServerFn(adminList);
  return useQuery({
    queryKey: ["admin-options", source],
    queryFn: () => list({ data: { table: source! } }),
    enabled: Boolean(source),
  });
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const options = useOptionRows(field.optionsFrom);

  if (field.type === "boolean") {
    return (
      <div className="flex h-10 items-center">
        <Switch checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <Textarea rows={4} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
    );
  }
  if (field.type === "media") {
    return <MediaInput value={String(value ?? "")} onChange={onChange} />;
  }
  if (field.type === "select") {
    const items =
      field.options ??
      (options.data ?? []).map((row) => {
        const r = row as Row;
        return {
          value: String(r["id"] ?? ""),
          label: String(r["name_ar"] ?? r["title_ar"] ?? r["slug"] ?? r["id"] ?? ""),
        };
      });
    return (
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="اختر" />
        </SelectTrigger>
        <SelectContent>
          {items.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function CrudSection({ sectionKey }: { sectionKey: string }) {
  const config = useMemo(
    () => sections.find((s) => s.key === sectionKey) ?? sections[0]!,
    [sectionKey],
  );
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const insert = useServerFn(adminInsert);
  const update = useServerFn(adminUpdate);
  const remove = useServerFn(adminDelete);

  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(() => initialForm(config));
  const [open, setOpen] = useState(false);

  const rowsQuery = useQuery({
    queryKey: ["admin-rows", config.table],
    queryFn: () => list({ data: { table: config.table } }),
  });

  const rows = (rowsQuery.data ?? []) as Row[];
  const singleRow = config.singleRow ? (rows[0] ?? null) : null;

  const hydrated = useRef<string | null>(null);
  useEffect(() => {
    if (!config.singleRow || !singleRow) return;
    if (hydrated.current === config.key) return;
    hydrated.current = config.key;
    setForm(initialForm(config, singleRow));
  }, [config, singleRow]);

  function startEdit(row: Row | null) {
    setEditing(row);
    setForm(initialForm(config, row ?? undefined));
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const values = toPayload(config, form);
      const target = config.singleRow ? singleRow : editing;
      if (target) {
        await update({
          data: {
            table: config.table,
            keyColumn: config.keyColumn,
            keyValue: String(target[config.keyColumn]),
            values,
          },
        });
      } else {
        await insert({ data: { table: config.table, values } });
      }
    },
    onSuccess: () => {
      toast.success("تم الحفظ");
      setOpen(false);
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin-rows", config.table] });
    },
    onError: () => toast.error("فشل الحفظ، تحقق من الحقول المطلوبة"),
  });

  const destroy = useMutation({
    mutationFn: (row: Row) =>
      remove({
        data: {
          table: config.table,
          keyColumn: config.keyColumn,
          keyValue: String(row[config.keyColumn]),
        },
      }),
    onSuccess: () => {
      toast.success("تم الحذف");
      void qc.invalidateQueries({ queryKey: ["admin-rows", config.table] });
    },
    onError: () => toast.error("فشل الحذف"),
  });

  const editorOpen = config.singleRow || open;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{config.label}</h2>
        {!config.singleRow && !config.readOnly && (
          <Button onClick={() => startEdit(null)}>
            <Plus className="size-4" /> إضافة
          </Button>
        )}
      </div>

      {rowsQuery.isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> جارٍ التحميل…
        </div>
      )}

      {!config.singleRow && (
        <div className="grid gap-3">
          {rows.map((row) => (
            <Card key={String(row[config.keyColumn])}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {String(row[config.titleField] ?? row[config.keyColumn])}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {String(row["message"] ?? row["slug"] ?? row["event_date"] ?? "")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(row)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => destroy.mutate(row)}
                    disabled={destroy.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!rowsQuery.isLoading && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          )}
        </div>
      )}

      {editorOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {config.singleRow ? "تعديل الإعدادات" : editing ? "تعديل عنصر" : "عنصر جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {config.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                <FieldControl
                  field={field}
                  value={form[field.name]}
                  onChange={(next) => setForm((prev) => ({ ...prev, [field.name]: next }))}
                />
              </div>
            ))}
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending && <Loader2 className="size-4 animate-spin" />} حفظ
              </Button>
              {!config.singleRow && (
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
