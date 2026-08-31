import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { buildMeta, headSource } from "@/lib/head";
import { formatDate, useLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";
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
        <ol className="relative space-y-10 ps-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 start-[3px] w-px bg-gradient-to-b from-transparent via-primary-glow/60 to-transparent"
          />
          {events.map((event, index) => {
            const image = event.image_url ? mediaUrl(event.image_url) : null;
            const caption = pick(
              (event as { caption_ar?: string | null }).caption_ar,
              (event as { caption_en?: string | null }).caption_en,
            );
            return (
              <li key={event.id} className="relative">
                <Reveal delay={Math.min(index, 6) * 80}>
                  <span className="absolute -start-8 top-2 size-3 rounded-full bg-primary-glow shadow-[0_0_0_4px_hsl(var(--background))] ring-2 ring-primary-glow/40">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary-glow/60" />
                  </span>

                  <article className="group rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary-glow/50 hover:shadow-[0_18px_40px_-24px_hsl(var(--primary))]">
                    <p className="text-sm font-semibold tracking-wide text-primary-glow">
                      {formatDate(event.event_date, lang)}
                    </p>

                    {caption ? (
                      <p className="mt-1 text-sm text-muted-foreground/90">{caption}</p>
                    ) : null}

                    {image ? (
                      <div className="mt-3 overflow-hidden rounded-xl border border-border/60">
                        <img
                          src={image}
                          alt={pick(event.title_ar, event.title_en) ?? ""}
                          loading="lazy"
                          className="h-52 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] md:h-64"
                        />
                      </div>
                    ) : null}

                    <h2 className="mt-4 text-xl font-bold text-foreground">
                      {pick(event.title_ar, event.title_en)}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {pick(event.description_ar, event.description_en)}
                    </p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </section>
    </SiteLayout>
  );
}
