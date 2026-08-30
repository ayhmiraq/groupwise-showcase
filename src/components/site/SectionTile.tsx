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
 * Wide rectangular, centered section tile. Its own background (image, uploaded
 * video or YouTube video) is configured per page in the admin panel, with the
 * Aether effect layered above it. Text and its colors sit on their own layer so
 * they never change with the background.
 */
export function SectionTile({ to, title, subtitle, page }: Props) {
  const tileType = page?.tile_bg_type ?? "none";
  const tileImage = tileType === "image" ? page?.tile_bg_url : null;
  const tileVideo = tileType === "video" ? page?.tile_bg_url : null;
  const tileYoutube = tileType === "youtube" ? page?.tile_youtube_id : null;
  // Fallback to the page background image when no tile-specific media is set.
  const fallbackImage = tileType === "none" ? page?.bg_url : null;
  const hasMedia = Boolean(tileImage || tileVideo || tileYoutube || fallbackImage);
  const overlay =
    Math.min(Math.max(page?.tile_overlay ?? page?.overlay ?? 55, 0), 95) / 100;
  const fxOn = page?.fx_enabled ?? true;

  return (
    <Link
      to={to}
      className="card-elevated group relative mx-auto block h-full w-full overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-primary-glow"
    >
      <div className="absolute inset-0" aria-hidden="true">
        {tileImage || fallbackImage ? (
          <img
            src={(tileImage || fallbackImage) as string}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
        {tileVideo ? (
          <video
            src={tileVideo}
            className="pointer-events-none h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            controls={false}
            disablePictureInPicture
          />
        ) : null}
        {tileYoutube ? (
          <iframe
            className="pointer-events-none absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 border-0"
            src={`https://www.youtube.com/embed/${tileYoutube}?autoplay=1&mute=1&controls=0&loop=1&playlist=${tileYoutube}&modestbranding=1&playsinline=1&rel=0&showinfo=0`}
            title=""
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        ) : null}
        <div className="hero-overlay absolute inset-0" style={{ opacity: hasMedia ? overlay : 1 }} />
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

      <div className="relative flex min-h-44 flex-col items-center justify-center px-5 py-8 text-center">
        <h2 className="text-xl font-bold text-foreground md:text-2xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-xs text-xs text-muted-foreground md:text-sm">{subtitle}</p>
        ) : null}
        <span className="mt-4 inline-flex size-8 items-center justify-center rounded-full border border-primary-glow/40 text-primary-glow">
          <ArrowLeft className="size-4 ltr:rotate-180" />
        </span>
      </div>
    </Link>
  );
}
