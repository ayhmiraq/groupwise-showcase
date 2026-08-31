import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout } from "@/components/site/SiteLayout";
import type { PageSettings } from "@/lib/content.server";
import { formatDate, useLang } from "@/lib/i18n";
import { companyQuery, siteQuery } from "@/lib/queries";


export const Route = createFileRoute("/companies/$slug")({
  loader: async ({ context, params }) => {
    const [, data] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(companyQuery(params.slug)),
    ]);
    if (!data) throw notFound();
    return { name: data.company.name_ar, tagline: data.company.tagline_ar };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "غير متوفر | Unavailable" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} | شركات المجموعة`;
    const description = loaderData.tagline || "شركة تابعة لمجموعة الشركات مع تسلسلها الزمني.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CompanyPage,
});

function CompanyPage() {
  const { slug } = Route.useParams();
  const { pick, t, lang } = useLang();
  const data = useSuspenseQuery(companyQuery(slug)).data;
  if (!data) return null;
  const { company, timeline, projects } = data;

  const c = company as typeof company & {
    page_bg_type?: string;
    page_bg_url?: string | null;
    page_youtube_id?: string | null;
    page_overlay?: number;
    page_title_ar?: string;
    page_title_en?: string;
    page_subtitle_ar?: string;
    page_subtitle_en?: string;
    page_content_ar?: string;
    page_content_en?: string;
    timeline_title_ar?: string;
    timeline_title_en?: string;
    opening_date?: string | null;
    page_image_url?: string | null;
    page_layout?: string | null;
    timeline_style?: string | null;
  };

  const page: PageSettings = {
    page_key: `company-${company.slug}`,
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    bg_type: c.page_bg_type || "color",
    bg_url: c.page_bg_url ?? company.image_url ?? null,
    youtube_id: c.page_youtube_id ?? null,
    overlay: c.page_overlay ?? 65,
    enabled: true,
  };

  const heroTitle = pick(c.page_title_ar || company.name_ar, c.page_title_en || company.name_en);
  const heroSubtitle = pick(
    c.page_subtitle_ar || company.tagline_ar,
    c.page_subtitle_en || company.tagline_en,
  );
  const details = pick(
    c.page_content_ar || company.description_ar,
    c.page_content_en || company.description_en,
  );
  const timelineTitle = pick(c.timeline_title_ar, c.timeline_title_en) || t("timeline");

  return (
    <SiteLayout>
      <PageHero page={page} title={heroTitle} subtitle={heroSubtitle}>
        <Link to="/companies" className="text-sm text-primary-glow hover:underline">
          ← {t("companies")}
        </Link>
      </PageHero>

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <Reveal>
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
            {company.founded_date ? (
              <p className="rounded-full border border-border/60 bg-surface/60 px-4 py-1.5 text-primary-glow">
                {t("founded")}: {formatDate(company.founded_date, lang)}
              </p>
            ) : null}
            {c.opening_date ? (
              <p className="rounded-full border border-border/60 bg-surface/60 px-4 py-1.5 text-primary-glow">
                {pick("تاريخ الافتتاح", "Opening date")}: {formatDate(c.opening_date, lang)}
              </p>
            ) : null}
          </div>
        </Reveal>

        {pageImage && layout === "magazine" ? (
          <Reveal delay={80}>
            <img
              src={mediaUrl(pageImage)}
              alt={heroTitle}
              loading="lazy"
              className="mt-8 aspect-[21/9] w-full rounded-2xl border border-border/60 object-cover shadow-lg"
            />
          </Reveal>
        ) : null}

        <div
          className={
            layout === "split" && pageImage
              ? "mt-8 grid items-start gap-6 md:grid-cols-[1.2fr_1fr] md:gap-10"
              : "mt-8"
          }
        >
          <Reveal>
            <div className="card-elevated max-w-none p-5 sm:p-7">
              <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                {details}
              </p>
            </div>
          </Reveal>
          {layout === "split" && pageImage ? (
            <Reveal delay={120}>
              <img
                src={mediaUrl(pageImage)}
                alt={heroTitle}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-2xl border border-border/60 object-cover shadow-lg"
              />
            </Reveal>
          ) : null}
        </div>

        <h2 className="mt-10 text-xl font-bold text-foreground sm:mt-14 sm:text-2xl">
          {timelineTitle}
        </h2>

        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("noItems")}</p>
        ) : timelineStyle === "cards" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {timeline.map((event, i) => (
              <Reveal key={event.id} delay={i * 70}>
                <article className="card-elevated h-full overflow-hidden">
                  {(event as { image_url?: string | null }).image_url ? (
                    <img
                      src={mediaUrl((event as { image_url?: string | null }).image_url)}
                      alt={pick(event.title_ar, event.title_en)}
                      loading="lazy"
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : null}
                  <div className="p-4 sm:p-5">
                    <p className="text-xs font-semibold text-primary-glow sm:text-sm">
                      {formatDate(event.event_date, lang)}
                    </p>
                    <h3 className="mt-1 text-base font-bold leading-snug text-foreground sm:text-lg">
                      {pick(event.title_ar, event.title_en)}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                      {pick(event.description_ar, event.description_en)}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        ) : timelineStyle === "alternating" ? (
          <div className="relative mt-8 space-y-8">
            <span className="absolute inset-y-0 start-2 w-px bg-gradient-to-b from-transparent via-primary-glow/50 to-transparent md:start-1/2" />
            {timeline.map((event, i) => (
              <Reveal key={event.id} delay={i * 70}>
                <div
                  className={`relative ps-8 md:w-1/2 md:ps-0 ${
                    i % 2 === 0 ? "md:pe-10" : "md:ms-auto md:ps-10"
                  }`}
                >
                  <span
                    className={`absolute start-[0.3rem] top-2 size-3 rounded-full bg-primary-glow shadow-[0_0_12px_hsl(var(--primary)/0.8)] ${
                      i % 2 === 0 ? "md:-end-1.5 md:start-auto" : "md:-start-1.5"
                    }`}
                  />
                  <div className="card-elevated overflow-hidden p-4 sm:p-5">
                    <p className="text-xs font-semibold text-primary-glow sm:text-sm">
                      {formatDate(event.event_date, lang)}
                    </p>
                    <h3 className="mt-1 text-base font-bold leading-snug text-foreground sm:text-lg">
                      {pick(event.title_ar, event.title_en)}
                    </h3>
                    {(event as { image_url?: string | null }).image_url ? (
                      <img
                        src={mediaUrl((event as { image_url?: string | null }).image_url)}
                        alt={pick(event.title_ar, event.title_en)}
                        loading="lazy"
                        className="mt-3 aspect-[16/9] w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
                      {pick(event.description_ar, event.description_en)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <ol className="relative mt-6 space-y-6 ps-5 sm:space-y-8 sm:ps-6">
            <span className="absolute inset-y-0 start-0 w-px bg-gradient-to-b from-transparent via-primary-glow/50 to-transparent" />
            {timeline.map((event, i) => (
              <li key={event.id} className="relative">
                <Reveal delay={i * 60}>
                  <span className="absolute -start-[1.65rem] top-1.5 size-3 rounded-full bg-primary-glow shadow-[0_0_12px_hsl(var(--primary)/0.8)] sm:-start-[1.9rem]" />
                  <p className="text-xs font-semibold text-primary-glow sm:text-sm">
                    {formatDate(event.event_date, lang)}
                  </p>
                  <h3 className="mt-1 text-base font-bold leading-snug text-foreground sm:text-lg">
                    {pick(event.title_ar, event.title_en)}
                  </h3>
                  {(event as { image_url?: string | null }).image_url ? (
                    <img
                      src={mediaUrl((event as { image_url?: string | null }).image_url)}
                      alt={pick(event.title_ar, event.title_en)}
                      loading="lazy"
                      className="mt-3 aspect-[16/9] w-full max-w-lg rounded-xl border border-border/60 object-cover"
                    />
                  ) : null}
                  <p className="mt-1 max-w-3xl break-words text-sm leading-relaxed text-muted-foreground">
                    {pick(event.description_ar, event.description_en)}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        )}


        {projects.length > 0 ? (
          <>
            <h2 className="mt-10 text-xl font-bold text-foreground sm:mt-14 sm:text-2xl">
              {t("projects")}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="card-elevated overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={pick(project.title_ar, project.title_en)}
                      className="aspect-[16/9] w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="min-w-0 p-4 sm:p-5">
                    <h3 className="font-bold text-foreground">
                      {pick(project.title_ar, project.title_en)}
                    </h3>
                    <p className="mt-1 text-xs text-primary-glow">{t(project.status)}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </SiteLayout>
  );
}
