import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { formatDate, useLang } from "@/lib/i18n";
import { journeyQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/journey")({
  loader: async ({ context }) => {
    const [site] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(journeyQuery),
    ]);
    return headSource(site, "journey");
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "مسيرتنا",
      fallbackDescription:
        "محطات مفصلية في مسيرة المجموعة من التأسيس حتى اليوم.",
    }),
  }),
  component: JourneyPage,
});

function JourneyPage() {
  const { pick, lang } = useLang();
  const events = useSuspenseQuery(journeyQuery).data;
  const page = usePageSettings("journey");

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || "مسيرتنا"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto px-4 py-16">
        <ol className="relative space-y-8 border-s border-border/70 ps-6">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -start-[1.9rem] top-1.5 size-3 rounded-full bg-primary-glow" />
              <p className="text-sm font-semibold text-primary-glow">
                {formatDate(event.event_date, lang)}
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {pick(event.title_ar, event.title_en)}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {pick(event.description_ar, event.description_en)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </SiteLayout>
  );
}
