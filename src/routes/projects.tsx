import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { formatDate, useLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";
import { galleryQuery, projectsQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/projects")({
  loader: async ({ context }) => {
    const [site] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(projectsQuery),
      context.queryClient.ensureQueryData(galleryQuery),
    ]);
    return headSource(site, "projects");
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "المشاريع",
      fallbackDescription:
        "مشاريع المجموعة المنجزة وقيد التنفيذ والمخططة عبر قطاعات متعددة.",
    }),
  }),
  component: ProjectsPage,
});

const statuses = ["all", "completed", "ongoing", "planned"] as const;

function ProjectsPage() {
  const { pick, t, lang } = useLang();
  const projects = useSuspenseQuery(projectsQuery).data;
  const gallery = useSuspenseQuery(galleryQuery).data;
  const page = usePageSettings("projects");
  const [filter, setFilter] = useState<(typeof statuses)[number]>("all");
  const [zoom, setZoom] = useState<number | null>(null);

  const visible = projects.filter((project) => filter === "all" || project.status === filter);
  const visibleIds = new Set(visible.map((project) => project.id));
  const images = gallery.filter(
    (image) => filter === "all" || !image.project_id || visibleIds.has(image.project_id),
  );
  const active = zoom === null ? null : (images[zoom] ?? null);

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || "المشاريع"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "all" ? t("allCategories") : t(status)}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((project) => (
            <article key={project.id} className="card-elevated overflow-hidden">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt={pick(project.title_ar, project.title_en)}
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-primary-glow">
                  <span>{t(project.status)}</span>
                  <span>{formatDate(project.start_date, lang)}</span>
                </div>
                <h2 className="mt-2 text-lg font-bold text-foreground">
                  {pick(project.title_ar, project.title_en)}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pick(project.description_ar, project.description_en)}
                </p>
                {project.location_ar || project.location_en ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {t("location")}: {pick(project.location_ar, project.location_en)}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noItems")}</p>
          ) : null}
        </div>
      </section>

      {images.length > 0 ? (
        <section className="container mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold text-foreground">
            {lang === "en" ? "Photo gallery" : "مكتبة الصور"}
          </h2>
          <div className="mt-6 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {images.map((image, index) => {
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
                    alt={
                      title ||
                      caption ||
                      `${pick(page?.title_ar, page?.title_en) || "المشاريع"} — من أعمال المجموعة`
                    }
                    className="w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {title || caption ? (
                    <figcaption className="p-4">
                      {title ? (
                        <p className="text-sm font-bold text-foreground">{title}</p>
                      ) : null}
                      {caption ? (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {caption}
                        </p>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </section>
      ) : null}

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/95 p-4 backdrop-blur"
          onClick={() => setZoom(null)}
          role="button"
          tabIndex={-1}
        >
          <img
            src={mediaUrl(active.image_url)}
            alt={
              pick(active.title_ar, active.title_en) ||
              pick(active.caption_ar, active.caption_en) ||
              "صورة موسّعة من أعمال ومشاريع المجموعة"
            }
            className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
          />
          {pick(active.title_ar, active.title_en) || pick(active.caption_ar, active.caption_en) ? (
            <div className="max-w-2xl text-center">
              <p className="font-bold text-foreground">
                {pick(active.title_ar, active.title_en)}
              </p>
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
