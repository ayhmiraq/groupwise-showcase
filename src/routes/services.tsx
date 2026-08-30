import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { useLang } from "@/lib/i18n";
import { servicesQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/services")({
  loader: async ({ context }) => {
    const [site] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(servicesQuery),
    ]);
    return headSource(site, "services");
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "خدماتنا",
      fallbackDescription:
        "خدمات المجموعة في المقاولات والطاقة والتقنية والخدمات اللوجستية.",
    }),
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
