import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { useLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";
import { galleryQuery, projectsQuery, siteQuery } from "@/lib/queries";
import { SITE_URL, galleryJsonLd } from "@/lib/structured-data";

export const Route = createFileRoute("/gallery")({
  loader: async ({ context }) => {
    const [site, gallery] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(galleryQuery),
      context.queryClient.ensureQueryData(projectsQuery),
    ]);
    return { ...headSource(site, "gallery"), gallery };
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "مكتبة الصور",
      fallbackDescription: "مكتبة صور المجموعة: صور المشاريع والأعمال المنجزة مع نصوص توضيحية.",
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/gallery` }],
    scripts: loaderData
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(galleryJsonLd(loaderData.gallery ?? [])),
          },
        ]
      : [],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const { pick, t } = useLang();
  const images = useSuspenseQuery(galleryQuery).data;
  const projects = useSuspenseQuery(projectsQuery).data;
  const page = usePageSettings("gallery");
  const [filter, setFilter] = useState<string>("all");
  const [zoom, setZoom] = useState<number | null>(null);

  const usedProjectIds = new Set(
    images.map((image) => image.project_id).filter((id): id is string => Boolean(id)),
  );
  const filterProjects = projects.filter((project) => usedProjectIds.has(project.id));
  const visible = images.filter((image) => filter === "all" || image.project_id === filter);
  const active = zoom === null ? null : (visible[zoom] ?? null);

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || t("gallery")}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto px-4 py-12 md:py-16">
        {filterProjects.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {[{ id: "all", label: t("allCategories") }, ...filterProjects.map((project) => ({
              id: project.id,
              label: pick(project.title_ar, project.title_en),
            }))].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  setZoom(null);
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  filter === item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-8 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
          {visible.map((image, index) => {
            const title = pick(image.title_ar, image.title_en);
            const caption = pick(image.caption_ar, image.caption_en);
            return (
              <figure
                key={image.id}
                className="card-elevated cursor-zoom-in overflow-hidden break-inside-avoid"
                onClick={() => setZoom(index)}
              >
                <img
                  src={mediaUrl(image.image_url)}
                  alt={title || caption || "من مكتبة صور أعمال ومشاريع المجموعة"}
                  className="w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                />
                {title || caption ? (
                  <figcaption className="p-4">
                    {title ? <p className="text-sm font-bold text-foreground">{title}</p> : null}
                    {caption ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{caption}</p>
                    ) : null}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("noItems")}</p>
        ) : null}
      </section>

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/95 p-4 backdrop-blur"
          onClick={() => setZoom(null)}
          role="button"
          tabIndex={-1}
        >
          <button
            type="button"
            aria-label="إغلاق"
            className="absolute end-4 top-4 grid size-10 place-items-center rounded-full border border-border text-foreground"
            onClick={() => setZoom(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={mediaUrl(active.image_url)}
            alt={
              pick(active.title_ar, active.title_en) ||
              pick(active.caption_ar, active.caption_en) ||
              "صورة موسّعة من مكتبة صور المجموعة"
            }
            className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
          />
          {pick(active.title_ar, active.title_en) || pick(active.caption_ar, active.caption_en) ? (
            <div className="max-w-2xl text-center">
              <p className="font-bold text-foreground">{pick(active.title_ar, active.title_en)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pick(active.caption_ar, active.caption_en)}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </SiteLayout>
  );
}
