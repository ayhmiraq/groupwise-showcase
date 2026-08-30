import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SectionTile } from "@/components/site/SectionTile";
import { SiteLayout, usePageSettings, useSiteData } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { useLang } from "@/lib/i18n";
import { siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const site = await context.queryClient.ensureQueryData(siteQuery);
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
  const { pick, t } = useLang();
  const { settings } = useSiteData();
  const page = usePageSettings("home");
  const servicesPage = usePageSettings("services");
  const projectsPage = usePageSettings("projects");
  const journeyPage = usePageSettings("journey");

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
        <SectionTile
          to="/services"
          title={pick(servicesPage?.title_ar, servicesPage?.title_en) || t("services")}
          subtitle={pick(servicesPage?.subtitle_ar, servicesPage?.subtitle_en)}
          page={servicesPage}
        />
        <SectionTile
          to="/projects"
          title={pick(projectsPage?.title_ar, projectsPage?.title_en) || t("projects")}
          subtitle={pick(projectsPage?.subtitle_ar, projectsPage?.subtitle_en)}
          page={projectsPage}
        />
        <SectionTile
          to="/journey"
          title={pick(journeyPage?.title_ar, journeyPage?.title_en) || t("journey")}
          subtitle={pick(journeyPage?.subtitle_ar, journeyPage?.subtitle_en)}
          page={journeyPage}
        />
      </section>

    </SiteLayout>
  );
}
