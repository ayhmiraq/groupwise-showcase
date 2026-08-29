import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Facebook,
  Instagram,
  Languages,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Phone,
  Youtube,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
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
  const { lang, setLang, t, pick } = useLang();
  const { settings } = useSiteData();

  return (
    <div className="border-b border-border/60 bg-surface/80 text-sm backdrop-blur">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
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
          <span className="hidden items-center gap-1.5 md:flex">
            <MapPin className="size-3.5" />
            {pick(settings?.address_ar, settings?.address_en)}
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
            {settings?.instagram ? (
              <a href={settings.instagram} aria-label="Instagram" target="_blank" rel="noreferrer">
                <Instagram className="size-4 hover:text-primary-glow" />
              </a>
            ) : null}
            {settings?.linkedin ? (
              <a href={settings.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer">
                <Linkedin className="size-4 hover:text-primary-glow" />
              </a>
            ) : null}
            {settings?.youtube ? (
              <a href={settings.youtube} aria-label="YouTube" target="_blank" rel="noreferrer">
                <Youtube className="size-4 hover:text-primary-glow" />
              </a>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
          >
            <Languages className="size-3.5" />
            {t("langSwitch")}
          </button>
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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="" className="size-10 rounded-md object-cover" />
          ) : (
            <span className="grid size-10 place-items-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
              ⌂
            </span>
          )}
          <span className="text-lg font-bold text-foreground">
            {pick(settings?.group_name_ar, settings?.group_name_en)}
          </span>
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

function SiteFooter() {
  const { t, pick } = useLang();
  const { settings } = useSiteData();

  return (
    <footer className="mt-24 border-t border-border/60 bg-surface/60">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            {pick(settings?.group_name_ar, settings?.group_name_en)}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            {pick(settings?.footer_note_ar, settings?.footer_note_en)}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{t("quickLinks")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-primary-glow">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">{t("contactInfo")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {settings?.phone ? (
              <li dir="ltr" className="text-start">
                {settings.phone}
              </li>
            ) : null}
            {settings?.email ? (
              <li dir="ltr" className="text-start">
                {settings.email}
              </li>
            ) : null}
            <li>{pick(settings?.address_ar, settings?.address_en)}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {pick(settings?.group_name_ar, settings?.group_name_en)} —{" "}
        {t("rights")}
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
