import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SectionTile } from "@/components/site/SectionTile";
import { SiteLayout, usePageSettings, useSiteData } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { formatDate, useLang } from "@/lib/i18n";
import { companiesQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const [site] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(companiesQuery),
    ]);
    return headSource(site, "home");
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "الرئيسية",
      fallbackDescription:
        "مجموعة شركات متكاملة في الهندسة والطاقة والتقنية واللوجستيات، مع متجر ومشاريع ومسيرة موثقة.",
    }),
  }),
  component: HomePage,
});

function HomePage() {
  const { pick, t, lang } = useLang();
  const { settings } = useSiteData();
  const page = usePageSettings("home");
  const companies = useSuspenseQuery(companiesQuery).data;

  return (
    <SiteLayout>
      <PageHero
        page={page}
        title={pick(page?.title_ar, page?.title_en) || pick(settings?.group_name_ar, settings?.group_name_en)}
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

      <section className="container mx-auto grid grid-cols-1 gap-6 px-4 py-20 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const url = company.link_url?.trim() || "";
          const isExternal = company.link_type === "external" && /^https?:\/\//i.test(url);
          const isInternal = company.link_type === "internal" && url.startsWith("/");
          return (
            <SectionTile
              key={company.id}
              {...(isExternal
                ? { href: url }
                : { to: isInternal ? url : `/companies/${company.slug}` })}
              title={pick(company.name_ar, company.name_en)}
              subtitle={pick(company.tagline_ar, company.tagline_en)}
              imageUrl={company.image_url}
              tileBgType={company.tile_bg_type}
              tileBgUrl={company.tile_bg_url}
              tileYoutubeId={company.tile_youtube_id}
              tileOverlay={company.tile_overlay}
              meta={
                company.founded_date
                  ? `${t("founded")}: ${formatDate(company.founded_date, lang)}`
                  : undefined
              }
              page={page}
            />

          );
        })}
      </section>

    </SiteLayout>
  );
}
