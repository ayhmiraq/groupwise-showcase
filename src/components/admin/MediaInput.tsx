import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Cloud, Globe, Loader2, Upload } from "lucide-react";

import { adminUploadMedia, adminUploadFreeHost } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Target = "free" | "internal";

export function MediaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const uploadInternal = useServerFn(adminUploadMedia);
  const uploadFree = useServerFn(adminUploadFreeHost);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<Target>("free");

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      if (target === "free") {
        const res = await uploadFree({ data: form });
        onChange(res.url);
        toast.success(
          res.host === "catbox"
            ? "تم الرفع إلى الخادم المجاني"
            : "تعذّر الوصول للخادم المجاني — تم الرفع إلى التخزين الداخلي",
        );
      } else {
        const res = await uploadInternal({ data: form });
        onChange(res.url);
        toast.success("تم رفع الملف");
      }
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      setBusy(false);
    }
  }

  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رابط الملف (خارجي أو مرفوع)"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">مكان الرفع:</span>
        <Button
          type="button"
          size="sm"
          variant={target === "free" ? "default" : "outline"}
          onClick={() => setTarget("free")}
        >
          <Globe className="me-1 size-3.5" /> خادم مجاني (حتى 200MB)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={target === "internal" ? "default" : "outline"}
          onClick={() => setTarget("internal")}
        >
          <Cloud className="me-1 size-3.5" /> التخزين الداخلي
        </Button>
      </div>

      {value ? (
        isVideo ? (
          <video
            src={mediaUrl(value)}
            className="h-24 w-full rounded-md border object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={mediaUrl(value)}
            alt=""
            className="h-24 w-full rounded-md border object-cover"
          />
        )
      ) : null}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
