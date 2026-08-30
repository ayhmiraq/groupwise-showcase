import type { ReactNode } from "react";

import type { PageSettings } from "@/lib/content.server";
import { AetherField } from "./AetherField";

type Props = {
  page: PageSettings | undefined;
  title: string;
  subtitle?: string;
  compact?: boolean;
  children?: ReactNode;
};

/**
 * Renders the customizable page background (color / image / uploaded video /
 * YouTube video). Text always sits on its own layer above an overlay so its
 * color and readability never change with the background.
 */
export function PageHero({ page, title, subtitle, compact = false, children }: Props) {
  const bgType = page?.enabled === false ? "color" : (page?.bg_type ?? "color");
  const overlay = Math.min(Math.max(page?.overlay ?? 65, 0), 95) / 100;
  const fxOn = page?.enabled !== false && (page?.fx_enabled ?? bgType === "aether");

  return (
    <section
      className={`relative isolate overflow-hidden ${compact ? "py-20" : "py-28 md:py-36"}`}
      aria-labelledby="page-hero-title"
    >
      <div className="absolute inset-0 -z-20 bg-background">
        {bgType === "image" && page?.bg_url ? (
          <img
            src={page.bg_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : null}

        {bgType === "video" && page?.bg_url ? (
          <video
            className="h-full w-full object-cover"
            src={page.bg_url}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : null}

        {bgType === "youtube" && page?.youtube_id ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <iframe
              title="background video"
              aria-hidden="true"
              tabIndex={-1}
              className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 border-0"
              src={`https://www.youtube.com/embed/${page.youtube_id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${page.youtube_id}&modestbranding=1&showinfo=0&rel=0&playsinline=1&disablekb=1`}
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : null}
      </div>

      <div
        className="hero-overlay absolute inset-0 -z-10"
        style={{ opacity: bgType === "color" || bgType === "aether" ? 1 : overlay }}
        aria-hidden="true"
      />

      {fxOn ? (
        <div className="absolute inset-0 -z-[9]" aria-hidden="true">
          <AetherField
            options={{
              density: page?.fx_density ?? 140,
              speed: page?.fx_speed ?? 40,
              hue: page?.fx_hue ?? 225,
              glow: page?.fx_glow ?? 60,
              grid: page?.fx_grid ?? true,
              scan: page?.fx_scan ?? true,
            }}
          />
        </div>
      ) : null}

      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-glow/40 bg-surface/60 px-4 py-1 text-xs font-semibold text-primary-glow backdrop-blur">
            {new Date().getFullYear()}
          </span>
          <h1
            id="page-hero-title"
            className="mt-5 text-4xl font-bold leading-tight text-foreground md:text-6xl"
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>
          ) : null}
          {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
