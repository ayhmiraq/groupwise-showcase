import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { SectionTile } from "@/components/site/SectionTile";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { useLang } from "@/lib/i18n";
import { siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(siteQuery);
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
  const { pick, t } = useLang();
  const page = usePageSettings("home");
  const servicesPage = usePageSettings("services");
  const projectsPage = usePageSettings("projects");
  const journeyPage = usePageSettings("journey");

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

      <section className="container mx-auto flex flex-col items-center gap-6 px-4 py-20">
        <SectionTile
          to="/services"
          title={t("services")}
          subtitle={pick(servicesPage?.subtitle_ar, servicesPage?.subtitle_en)}
          page={servicesPage}
        />
        <SectionTile
          to="/projects"
          title={t("projects")}
          subtitle={pick(projectsPage?.subtitle_ar, projectsPage?.subtitle_en)}
          page={projectsPage}
        />
        <SectionTile
          to="/journey"
          title={t("journey")}
          subtitle={pick(journeyPage?.subtitle_ar, journeyPage?.subtitle_en)}
          page={journeyPage}
        />
      </section>

    </SiteLayout>
  );
}
