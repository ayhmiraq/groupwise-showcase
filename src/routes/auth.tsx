import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | لوحة تحكم المجموعة" },
      { name: "description", content: "تسجيل دخول مدير الموقع للوصول إلى لوحة التحكم." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "تسجيل الدخول | لوحة تحكم المجموعة" },
      { property: "og:description", content: "دخول المدير إلى لوحة إدارة الموقع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const target = safePath(redirect);

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    navigate({ to: target });
  }

  async function signInWithGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth?redirect=${encodeURIComponent(target)}`,
    });
    if (result.error) {
      toast.error("تعذّر تسجيل الدخول عبر Google");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) navigate({ to: target });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="card-elevated w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          سجّل الدخول بحساب المدير لإدارة محتوى الموقع.
        </p>

        <form className="mt-6 space-y-4" onSubmit={signInWithPassword}>
          <div>
            <Label htmlFor="a-email">البريد الإلكتروني</Label>
            <Input
              id="a-email"
              type="email"
              dir="ltr"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="a-password">كلمة المرور</Label>
            <Input
              id="a-password"
              type="password"
              dir="ltr"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            تسجيل الدخول
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          أو
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={signInWithGoogle}>
          الدخول عبر Google
        </Button>
      </div>
    </div>
  );
}
