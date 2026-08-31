import { mediaUrl } from "@/lib/media-url";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Facebook,
  HardHat,
  Home,
  Languages,
  Mail,
  MapPin,
  Menu,
  Milestone,
  Phone,
  PhoneCall,
  ShoppingBag,
  Wrench,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  { to: "/", key: "home", icon: Home },
  { to: "/services", key: "services", icon: Wrench },
  { to: "/journey", key: "journey", icon: Milestone },
  { to: "/projects", key: "projects", icon: HardHat },
  { to: "/store", key: "store", icon: ShoppingBag },
  { to: "/contact", key: "contact", icon: PhoneCall },
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
        <div className="flex flex-col gap-0.5 text-muted-foreground">
          {settings?.phone ? (
            <a className="flex items-center gap-1.5 hover:text-primary-glow" href={`tel:${settings.phone}`}>
              <Phone className="size-3.5 shrink-0" />
              <span dir="ltr">{settings.phone}</span>
            </a>
          ) : null}
          {settings?.email ? (
            <a className="flex items-center gap-1.5 hover:text-primary-glow" href={`mailto:${settings.email}`}>
              <Mail className="size-3.5 shrink-0" />
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
              preload="viewport"
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
            aria-expanded={open}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface/70 text-foreground transition-colors active:bg-secondary lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="close menu"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <nav
          className={`absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto rounded-b-3xl border-b border-border/60 bg-surface/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out ${
            open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="truncate text-sm font-bold text-foreground">
              {pick(settings?.group_name_ar, settings?.group_name_en)}
            </span>
            <button
              type="button"
              aria-label="close"
              onClick={() => setOpen(false)}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <ul className="grid gap-1.5 px-3 pb-3">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.to}
                  className="transition-all duration-300 ease-out"
                  style={{
                    transitionDelay: open ? `${60 + index * 35}ms` : "0ms",
                    opacity: open ? 1 : 0,
                    transform: open ? "translateY(0)" : "translateY(-8px)",
                  }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    preload="viewport"
                    activeOptions={{ exact: item.to === "/" }}
                    activeProps={{
                      className: "border-primary/50 bg-secondary text-primary-glow",
                    }}
                    className="flex min-h-12 items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-base font-semibold text-muted-foreground transition-colors active:bg-secondary"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary/70">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 truncate">{t(item.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-4 py-3">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === item.code
                    ? "border-primary/60 bg-secondary text-primary-glow"
                    : "border-border text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {settings?.phone ? (
            <div className="px-3 pb-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
              <Button asChild className="min-h-12 w-full">
                <a href={`tel:${settings.phone}`} dir="ltr">
                  {settings.phone}
                </a>
              </Button>
            </div>
          ) : null}
        </nav>
      </div>
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
