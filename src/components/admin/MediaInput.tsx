import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { adminUploadMedia } from "@/lib/admin.functions";
import { mediaUrl } from "@/lib/media-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MediaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const upload = useServerFn(adminUploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await upload({ data: form });
      onChange(res.url);
      toast.success("تم رفع الملف");
    } catch {
      toast.error("فشل رفع الملف");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/api/public/media/... أو رابط خارجي"
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
      {value ? (
        /\.(mp4|webm|ogg)$/i.test(value) ? (
          <video src={mediaUrl(value)} className="h-24 w-full rounded-md object-cover" muted playsInline />
        ) : (
          <img src={mediaUrl(value)} alt="" className="h-24 w-full rounded-md object-cover" />
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
      {value && /\.(mp4|webm|mov)$/i.test(value) ? (
        <video src={mediaUrl(value)} className="h-24 rounded-md border" muted playsInline />
      ) : value ? (
        <img src={mediaUrl(value)} alt="" className="h-24 rounded-md border object-cover" />
      ) : null}
    </div>
  );
}
