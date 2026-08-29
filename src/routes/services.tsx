import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { useLang } from "@/lib/i18n";
import { servicesQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/services")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(servicesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "خدماتنا | Our Services — Ufuq Group" },
      {
        name: "description",
        content:
          "خدمات المجموعة في المقاولات والطاقة والتقنية والخدمات اللوجستية. Explore the engineering, energy, technology and logistics services of the group.",
      },
      { property: "og:title", content: "خدماتنا | Our Services — Ufuq Group" },
      {
        property: "og:description",
        content: "خدمات متكاملة من شركات المجموعة في الهندسة والطاقة والتقنية واللوجستيات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { pick } = useLang();
  const services = useSuspenseQuery(servicesQuery).data;
  const page = usePageSettings("services");

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || "خدماتنا"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article key={service.id} className="card-elevated p-6">
            <h2 className="text-xl font-bold text-foreground">
              {pick(service.title_ar, service.title_en)}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {pick(service.description_ar, service.description_en)}
            </p>
          </article>
        ))}
      </section>
    </SiteLayout>
  );
}
