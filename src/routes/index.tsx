import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { formatDate, useLang } from "@/lib/i18n";
import { homeQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(homeQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "مجموعة شركات أفق | Ufuq Group of Companies" },
      {
        name: "description",
        content:
          "مجموعة شركات متكاملة في الهندسة والطاقة والتقنية واللوجستيات، مع متجر ومشاريع ومسيرة موثقة. An integrated group of companies across engineering, energy, technology and logistics.",
      },
      { property: "og:title", content: "مجموعة شركات أفق | Ufuq Group of Companies" },
      {
        property: "og:description",
        content: "شركات المجموعة، خدماتها، مشاريعها ومتجرها في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { pick, t, lang } = useLang();
  const page = usePageSettings("home");
  const { companies, services, projects } = useSuspenseQuery(homeQuery).data;

  return (
    <SiteLayout>
      <PageHero
        page={page}
        title={pick(page?.title_ar, page?.title_en) || "مجموعة شركات أفق"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en) || t("companiesIntro")}
      >
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("companies")}
          <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
        </Link>
        <Link
          to="/store"
          className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
        >
          {t("store")}
        </Link>
      </PageHero>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-foreground">{t("ourCompanies")}</h2>
        <p className="mt-2 text-muted-foreground">{t("companiesIntro")}</p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {companies.map((company) => (
            <article key={company.id} className="card-elevated overflow-hidden">
              {company.image_url ? (
                <img
                  src={company.image_url}
                  alt={pick(company.name_ar, company.name_en)}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground">
                  {pick(company.name_ar, company.name_en)}
                </h3>
                <p className="mt-1 text-sm text-primary-glow">
                  {pick(company.tagline_ar, company.tagline_en)}
                </p>
                {company.founded_date ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("founded")}: {formatDate(company.founded_date, lang)}
                  </p>
                ) : null}
                <Link
                  to="/companies/$slug"
                  params={{ slug: company.slug }}
                  className="mt-4 inline-block text-sm font-semibold text-primary-glow hover:underline"
                >
                  {t("viewDetails")} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground">{t("services")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="card-elevated p-6">
                <h3 className="text-lg font-bold text-foreground">
                  {pick(service.title_ar, service.title_en)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {pick(service.description_ar, service.description_en)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-foreground">{t("projects")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className="card-elevated overflow-hidden">
              {project.image_url ? (
                <img
                  src={project.image_url}
                  alt=""
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-5">
                <h3 className="font-bold text-foreground">
                  {pick(project.title_ar, project.title_en)}
                </h3>
                <p className="mt-1 text-xs text-primary-glow">{t(project.status)}</p>
              </div>
            </article>
          ))}
        </div>
        <Link
          to="/projects"
          className="mt-8 inline-block text-sm font-semibold text-primary-glow hover:underline"
        >
          {t("readMore")} →
        </Link>
      </section>
    </SiteLayout>
  );
}
