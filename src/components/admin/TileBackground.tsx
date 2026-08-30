import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageIcon, Loader2 } from "lucide-react";

import { adminList, adminUpdate } from "@/lib/admin.functions";
import { broadcastContentUpdate } from "@/lib/content-sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaInput } from "./MediaInput";

type Row = Record<string, unknown>;

/** Section key in the admin menu -> page_settings.page_key of its home tile. */
export const tilePageKeyBySection: Record<string, string> = {
  services: "services",
  projects: "projects",
  journey: "journey",
};

/**
 * Inline panel that lets the admin set the background (image, uploaded video or
 * YouTube video) of the rectangular tile shown on the home page for this
 * section. Stored on the matching page_settings row.
 */
export function TileBackground({ pageKey }: { pageKey: string }) {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const update = useServerFn(adminUpdate);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({
    tile_bg_type: "none",
    tile_bg_url: "",
    tile_youtube_id: "",
    tile_overlay: "55",
  });

  const pagesQuery = useQuery({
    queryKey: ["admin-rows", "page_settings"],
    queryFn: () => list({ data: { table: "page_settings" } }),
  });

  const row = ((pagesQuery.data ?? []) as Row[]).find((r) => r["page_key"] === pageKey) ?? null;

  useEffect(() => {
    if (!row) return;
    setForm({
      tile_bg_type: String(row["tile_bg_type"] ?? "none"),
      tile_bg_url: row["tile_bg_url"] == null ? "" : String(row["tile_bg_url"]),
      tile_youtube_id: row["tile_youtube_id"] == null ? "" : String(row["tile_youtube_id"]),
      tile_overlay: row["tile_overlay"] == null ? "55" : String(row["tile_overlay"]),
    });
  }, [row]);

  const save = useMutation({
    mutationFn: async () =>
      update({
        data: {
          table: "page_settings",
          keyColumn: "page_key",
          keyValue: pageKey,
          values: {
            tile_bg_type: String(form["tile_bg_type"] || "none"),
            tile_bg_url: form["tile_bg_url"] ? String(form["tile_bg_url"]) : null,
            tile_youtube_id: form["tile_youtube_id"] ? String(form["tile_youtube_id"]) : null,
            tile_overlay:
              form["tile_overlay"] === "" ? null : Number(form["tile_overlay"]),
          },
        },
      }),
    onSuccess: () => {
      toast.success("تم حفظ خلفية المستطيل");
      void qc.invalidateQueries();
      broadcastContentUpdate();
    },
    onError: () => toast.error("فشل حفظ خلفية المستطيل"),
  });

  const type = String(form["tile_bg_type"] ?? "none");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">خلفية المستطيل في الواجهة</CardTitle>
        <Button size="sm" variant={open ? "secondary" : "default"} onClick={() => setOpen((v) => !v)}>
          <ImageIcon className="size-4" /> {open ? "إخفاء" : "تغيير صورة/فيديو الخلفية"}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="grid gap-4 md:grid-cols-2">
          {!row && (
            <p className="text-sm text-muted-foreground md:col-span-2">
              لا توجد إعدادات لهذه الصفحة بعد. أضِف صفحة بالمعرّف «{pageKey}» من قسم «خلفيات وتصميم
              الصفحات».
            </p>
          )}
          <div className="space-y-2">
            <Label>نوع الخلفية</Label>
            <Select
              value={type}
              onValueChange={(v) => setForm((p) => ({ ...p, tile_bg_type: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون (استخدام خلفية الصفحة)</SelectItem>
                <SelectItem value="image">صورة</SelectItem>
                <SelectItem value="video">فيديو مرفوع</SelectItem>
                <SelectItem value="youtube">فيديو يوتيوب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(type === "image" || type === "video") && (
            <div className="space-y-2">
              <Label>{type === "image" ? "الصورة" : "الفيديو"}</Label>
              <MediaInput
                value={String(form["tile_bg_url"] ?? "")}
                onChange={(next) => setForm((p) => ({ ...p, tile_bg_url: next }))}
              />
            </div>
          )}

          {type === "youtube" && (
            <div className="space-y-2">
              <Label>معرّف فيديو يوتيوب</Label>
              <Input
                value={String(form["tile_youtube_id"] ?? "")}
                onChange={(e) => setForm((p) => ({ ...p, tile_youtube_id: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>شفافية الطبقة (0-95)</Label>
            <Input
              type="number"
              value={String(form["tile_overlay"] ?? "")}
              onChange={(e) => setForm((p) => ({ ...p, tile_overlay: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending || !row}>
              {save.isPending && <Loader2 className="size-4 animate-spin" />} حفظ الخلفية
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
