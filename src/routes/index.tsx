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
  const { companies } = useSuspenseQuery(homeQuery).data;

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
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              title={pick(company.name_ar, company.name_en)}
              tagline={pick(company.tagline_ar, company.tagline_en)}
              dateLabel={
                company.founded_date
                  ? `${t("founded")}: ${formatDate(company.founded_date, lang)}`
                  : undefined
              }
              actionLabel={t("viewDetails")}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/services"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
          >
            {t("services")}
          </Link>
          <Link
            to="/projects"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
          >
            {t("projects")}
          </Link>
          <Link
            to="/journey"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
          >
            {t("journey")}
          </Link>
        </div>
      </section>

    </SiteLayout>
  );
}
