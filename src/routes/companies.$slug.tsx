import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";
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

      <section className="container mx-auto px-4 py-14">
        <div className="flex flex-wrap gap-6 text-sm">
          {company.founded_date ? (
            <p className="text-primary-glow">
              {t("founded")}: {formatDate(company.founded_date, lang)}
            </p>
          ) : null}
          {c.opening_date ? (
            <p className="text-primary-glow">
              {pick("تاريخ الافتتاح", "Opening date")}: {formatDate(c.opening_date, lang)}
            </p>
          ) : null}
        </div>

        <p className="mt-6 max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">
          {details}
        </p>

        <h2 className="mt-14 text-2xl font-bold text-foreground">{timelineTitle}</h2>

        <ol className="mt-6 space-y-8 border-s border-border/70 ps-6">
          {timeline.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -start-[1.9rem] top-1.5 size-3 rounded-full bg-primary-glow" />
              <p className="text-sm font-semibold text-primary-glow">
                {formatDate(event.event_date, lang)}
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                {pick(event.title_ar, event.title_en)}
              </h3>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {pick(event.description_ar, event.description_en)}
              </p>
            </li>
          ))}
          {timeline.length === 0 ? (
            <li className="text-sm text-muted-foreground">{t("noItems")}</li>
          ) : null}
        </ol>

        {projects.length > 0 ? (
          <>
            <h2 className="mt-14 text-2xl font-bold text-foreground">{t("projects")}</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="card-elevated overflow-hidden">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt=""
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="p-5">
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
