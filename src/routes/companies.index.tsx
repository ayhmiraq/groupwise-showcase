import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { formatDate, useLang } from "@/lib/i18n";
import { companiesQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/companies/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(companiesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "شركاتنا | Our Companies — Ufuq Group" },
      {
        name: "description",
        content:
          "الشركات التابعة للمجموعة مع نبذة وتسلسل زمني لكل شركة. The companies within the group, each with its own story and timeline.",
      },
      { property: "og:title", content: "شركاتنا | Our Companies — Ufuq Group" },
      {
        property: "og:description",
        content: "تعرّف على شركات المجموعة وتخصص كل شركة وتاريخ تأسيسها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { pick, t, lang } = useLang();
  const companies = useSuspenseQuery(companiesQuery).data;
  const page = usePageSettings("companies");

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || t("ourCompanies")}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en) || t("companiesIntro")}
      />
      <section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <article key={company.id} className="card-elevated overflow-hidden">
            {company.image_url ? (
              <img
                src={company.image_url}
                alt={pick(company.name_ar, company.name_en)}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground">
                {pick(company.name_ar, company.name_en)}
              </h2>
              <p className="mt-1 text-sm text-primary-glow">
                {pick(company.tagline_ar, company.tagline_en)}
              </p>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {pick(company.description_ar, company.description_en)}
              </p>
              {company.founded_date ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("founded")}: {formatDate(company.founded_date, lang)}
                </p>
              ) : null}
              <Link
                to="/companies/$slug"
                params={{ slug: company.slug }}
                className="mt-4 inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary-glow hover:text-primary-glow"
              >
                {t("viewDetails")}
              </Link>
            </div>
          </article>
        ))}
      </section>
    </SiteLayout>
  );
}
