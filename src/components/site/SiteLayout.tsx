import { mediaUrl } from "@/lib/media-url";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Facebook, Languages, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContentSync } from "@/lib/content-sync";
import { languages, useLang } from "@/lib/i18n";
import { siteQuery } from "@/lib/queries";

const navItems = [
  { to: "/", key: "home" },
  { to: "/services", key: "services" },
  { to: "/journey", key: "journey" },
  { to: "/projects", key: "projects" },
  { to: "/store", key: "store" },
  { to: "/contact", key: "contact" },
] as const;

export function useSiteData() {
  return useSuspenseQuery(siteQuery).data;
}

export function usePageSettings(pageKey: string) {
  const site = useSiteData();
  return site.pages.find((page) => page.page_key === pageKey);
}

function TopBar() {
  const { lang, setLang, pick } = useLang();
  const { settings } = useSiteData();

  return (
    <div className="bg-background/90 text-sm backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-1.5">
        <div className="flex items-center gap-4 text-muted-foreground">
          {settings?.phone ? (
            <a className="flex items-center gap-1.5 hover:text-primary-glow" href={`tel:${settings.phone}`}>
              <Phone className="size-3.5" />
              <span dir="ltr">{settings.phone}</span>
            </a>
          ) : null}
          {settings?.email ? (
            <a className="flex items-center gap-1.5 hover:text-primary-glow" href={`mailto:${settings.email}`}>
              <Mail className="size-3.5" />
              <span dir="ltr">{settings.email}</span>
            </a>
          ) : null}
          <span className="hidden items-center gap-1.5 truncate lg:flex">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{pick(settings?.address_ar, settings?.address_en)}</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-primary-glow sm:inline">
            {pick(settings?.topbar_text_ar, settings?.topbar_text_en)}
          </span>
          <div className="flex items-center gap-2 text-muted-foreground">
            {settings?.facebook ? (
              <a href={settings.facebook} aria-label="Facebook" target="_blank" rel="noreferrer">
                <Facebook className="size-4 hover:text-primary-glow" />
              </a>
            ) : null}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow">
              <Languages className="size-3.5" />
              {languages.find((item) => item.code === lang)?.label}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {languages.map((item) => (
                <DropdownMenuItem key={item.code} onClick={() => setLang(item.code)}>
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  const { t, pick } = useLang();
  const { settings } = useSiteData();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-border/60 bg-background/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img
              src={mediaUrl(settings.logo_url)}
              alt={pick(settings?.group_name_ar, settings?.group_name_en) ?? "logo"}
              className="h-12 w-auto max-w-44 rounded-md object-contain drop-shadow-sm"
            />
          ) : (
            <>
              <span className="grid size-10 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
                ⌂
              </span>
              <span className="text-lg font-bold text-foreground">
                {pick(settings?.group_name_ar, settings?.group_name_en)}
              </span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-primary-glow" }}
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/contact">{t("contact")}</Link>
          </Button>
          <button
            type="button"
            aria-label="menu"
            className="rounded-md border border-border p-2 lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border/60 bg-surface px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary-glow" }}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  useContentSync();
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50">
        <TopBar />
        <SiteHeader />
      </div>
      <main className="relative z-0 pb-16">{children}</main>
    </div>
  );
}
