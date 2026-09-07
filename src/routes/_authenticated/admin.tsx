import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";

import { adminIsAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CrudSection } from "@/components/admin/CrudSection";
import { ServerInfo } from "@/components/admin/ServerInfo";
import { sections } from "@/components/admin/fields";

const SERVER_KEY = "__server__";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | إدارة الموقع" },
      { name: "description", content: "لوحة تحكم متقدمة لإدارة محتوى الموقع والمتجر والمشاريع." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "لوحة التحكم" },
      { property: "og:description", content: "إدارة محتوى الموقع والمتجر والمشاريع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const check = useServerFn(adminIsAdmin);
  const [active, setActive] = useState(sections[0]!.key);

  const roleQuery = useQuery({ queryKey: ["admin-role"], queryFn: () => check() });

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  if (roleQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> جارٍ التحقق من الصلاحيات…
      </div>
    );
  }

  if (!roleQuery.data?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-destructive" />
        <h1 className="text-xl font-bold">لا تملك صلاحية الوصول للوحة التحكم</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          هذا الحساب ليس حساب مدير. يرجى الدخول بحساب المدير المخصص للموقع.
        </p>
        <Button variant="secondary" onClick={signOut}>
          <LogOut className="size-4" /> تسجيل الخروج
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <h1 className="text-lg font-bold">لوحة التحكم</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
              عرض الموقع
            </Button>
            <Button variant="secondary" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <nav className="flex flex-wrap gap-2 lg:w-64 lg:flex-col">
          {sections.map((section) => (
            <button
              key={section.key}
              onClick={() => setActive(section.key)}
              className={`rounded-md px-3 py-2 text-start text-sm font-medium transition-colors ${
                active === section.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-accent"
              }`}
            >
              {section.label}
            </button>
          ))}
          <button
            onClick={() => setActive(SERVER_KEY)}
            className={`rounded-md px-3 py-2 text-start text-sm font-medium transition-colors ${
              active === SERVER_KEY
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-accent"
            }`}
          >
            تفاصيل الخادم
          </button>
        </nav>
        <main className="flex-1">
          {active === SERVER_KEY ? (
            <ServerInfo />
          ) : (
            <CrudSection key={active} sectionKey={active} />
          )}
        </main>
      </div>
    </div>
  );
}
