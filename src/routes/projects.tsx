import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { formatDate, useLang } from "@/lib/i18n";
import { projectsQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/projects")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(projectsQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "المشاريع | Projects — Ufuq Group" },
      {
        name: "description",
        content:
          "مشاريع المجموعة المنجزة وقيد التنفيذ والمخططة عبر قطاعات متعددة. Completed, ongoing and planned projects across the group.",
      },
      { property: "og:title", content: "المشاريع | Projects — Ufuq Group" },
      {
        property: "og:description",
        content: "استعرض مشاريع المجموعة بحسب الحالة والموقع والشركة المنفذة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

const statuses = ["all", "completed", "ongoing", "planned"] as const;

function ProjectsPage() {
  const { pick, t, lang } = useLang();
  const projects = useSuspenseQuery(projectsQuery).data;
  const page = usePageSettings("projects");
  const [filter, setFilter] = useState<(typeof statuses)[number]>("all");

  const visible = projects.filter((project) => filter === "all" || project.status === filter);

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
    </SiteLayout>
  );
}
