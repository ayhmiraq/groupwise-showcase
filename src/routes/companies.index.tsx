import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CompanyCard } from "@/components/site/CompanyCard";
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
      <section className="container mx-auto grid gap-6 px-4 py-16 lg:grid-cols-2">
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
          >
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
              {pick(company.description_ar, company.description_en)}
            </p>
          </CompanyCard>
        ))}
      </section>
    </SiteLayout>
  );
}
