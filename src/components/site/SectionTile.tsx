import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import type { PageSettings } from "@/lib/content.server";
import { AetherField } from "./AetherField";

type Props = {
  to: string;
  title: string;
  subtitle?: string;
  page?: PageSettings | undefined;
};

/**
 * Wide rectangular, centered section tile. Optional background image comes from
 * the matching page settings, with the Aether effect layered above it. Text and
 * its colors sit on their own layer so they never change with the background.
 */
export function SectionTile({ to, title, subtitle, page }: Props) {
  const bgUrl = page?.bg_url;
  const overlay = Math.min(Math.max(page?.overlay ?? 65, 0), 95) / 100;
  const fxOn = page?.fx_enabled ?? true;

  return (
    <Link
      to={to}
      className="card-elevated group relative mx-auto block h-full w-full overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary-glow"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {bgUrl ? (
          <img src={bgUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : null}
        <div
          className="hero-overlay absolute inset-0"
          style={{ opacity: bgUrl ? overlay : 1 }}
        />
        {fxOn ? (
          <AetherField
            options={{
              density: page?.fx_density ?? 90,
              speed: page?.fx_speed ?? 35,
              hue: page?.fx_hue ?? 225,
              glow: page?.fx_glow ?? 55,
              grid: page?.fx_grid ?? true,
              scan: page?.fx_scan ?? true,
            }}
          />
        ) : null}
      </div>

      <div className="relative flex min-h-36 flex-col items-center justify-center px-6 py-10 text-center">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
        ) : null}
        <span className="mt-4 inline-flex size-9 items-center justify-center rounded-full border border-primary-glow/40 text-primary-glow">
          <ArrowLeft className="size-4 ltr:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
