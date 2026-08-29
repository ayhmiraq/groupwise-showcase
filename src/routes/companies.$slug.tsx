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

  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden py-20">
        <div className="absolute inset-0 -z-20 bg-background">
          {company.image_url ? (
            <img src={company.image_url} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="hero-overlay absolute inset-0 -z-10" style={{ opacity: 0.72 }} />
        <div className="container mx-auto px-4">
          <Link to="/companies" className="text-sm text-primary-glow hover:underline">
            ← {t("companies")}
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            {pick(company.name_ar, company.name_en)}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            {pick(company.tagline_ar, company.tagline_en)}
          </p>
          {company.founded_date ? (
            <p className="mt-2 text-sm text-primary-glow">
              {t("founded")}: {formatDate(company.founded_date, lang)}
            </p>
          ) : null}
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <p className="max-w-3xl leading-relaxed text-muted-foreground">
          {pick(company.description_ar, company.description_en)}
        </p>

        <h2 className="mt-14 text-2xl font-bold text-foreground">{t("timeline")}</h2>
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
