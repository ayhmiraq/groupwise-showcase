import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowDown, CalendarDays, GlassWater } from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { mediaUrl } from "@/lib/media-url";
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
  const { company, timeline, projects, menu } = data;

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

  const isRestaurant = menu.length > 0;
  const page: PageSettings = {
    page_key: `company-${company.slug}`,
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    bg_type:
      isRestaurant && (!c.page_bg_type || (c.page_bg_type === "color" && !c.page_bg_url))
        ? "image"
        : c.page_bg_type || "color",
    bg_url: c.page_bg_url ?? (isRestaurant ? "/restaurant/bebon-hero.jpg" : company.image_url) ?? null,
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
  const pageImage = c.page_image_url || "";
  const layout = c.page_layout || "classic";
  const timelineStyle = c.timeline_style || "line";

  if (isRestaurant) {
    return (
      <RestaurantCompanyPage
        company={company}
        page={page}
        title={heroTitle}
        subtitle={heroSubtitle}
        details={details}
        menu={menu}
        pick={pick}
        t={t}
      />
    );
  }

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

type RestaurantItem = {
  id: string;
  category: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  image_url: string | null;
};

type RestaurantCompanyProps = {
  company: { founded_date: string | null };
  page: PageSettings;
  title: string;
  subtitle: string;
  details: string;
  menu: RestaurantItem[];
  pick: (ar: string | null | undefined, en: string | null | undefined) => string;
  t: (key: string) => string;
};

function RestaurantCompanyPage({ page, title, subtitle, details, menu, pick, t }: RestaurantCompanyProps) {
  const sections = [
    { key: "oriental", title: pick("ركن الشرق", "Oriental kitchen") },
    { key: "western", title: pick("ركن الغرب", "Western kitchen") },
  ];
  const drinks = menu.filter((item) => item.category === "drinks");

  return (
    <SiteLayout>
      <div className="bg-restaurant-canvas text-restaurant-ink">
        <PageHero page={page} title={title} subtitle={subtitle || pick("ملتقى الأصالة الشرقية والإبداع الغربي في قلب واحد", "Where Eastern heritage meets Western creativity")}>
          <Button asChild className="bg-restaurant-gold text-restaurant-ink hover:bg-restaurant-gold/90">
            <Link to="/contact">
              <CalendarDays className="size-4" /> {pick("احجز طاولتك", "Book a table")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-foreground/40 bg-background/20 text-foreground backdrop-blur hover:bg-background/30">
            <a href="#restaurant-menu">
              <ArrowDown className="size-4" /> {pick("تصفح القائمة", "Explore the menu")}
            </a>
          </Button>
        </PageHero>

        <main id="restaurant-menu" className="mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:px-8">
          {details ? (
            <Reveal>
              <p className="mx-auto max-w-3xl whitespace-pre-line text-center text-base leading-8 text-restaurant-muted sm:text-lg">
                {details}
              </p>
            </Reveal>
          ) : null}

          <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-10 lg:mt-16">
            {sections.map((section, sectionIndex) => {
              const items = menu.filter((item) => item.category === section.key);
              if (items.length === 0) return null;
              return (
                <section key={section.key} aria-labelledby={`menu-${section.key}`}>
                  <div className="mb-7 flex items-center gap-4">
                    <span className="h-px flex-1 bg-restaurant-line" />
                    <h2 id={`menu-${section.key}`} className="text-3xl font-bold text-restaurant-ink">
                      {section.title}
                    </h2>
                    <span className="h-px flex-1 bg-restaurant-line" />
                  </div>
                  <div className="space-y-7">
                    {items.map((item, index) => (
                      <Reveal key={item.id} delay={(sectionIndex * 2 + index) * 60}>
                        <article className="group border-b border-restaurant-line/70 pb-7 last:border-0">
                          {item.image_url ? (
                            <div className="mb-4 aspect-[3/2] overflow-hidden rounded-lg bg-restaurant-line/40">
                              <img
                                src={mediaUrl(item.image_url)}
                                alt={pick(item.name_ar, item.name_en)}
                                width={1200}
                                height={800}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                              />
                            </div>
                          ) : null}
                          <h3 className="text-xl font-bold text-restaurant-ink">
                            {pick(item.name_ar, item.name_en)}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-restaurant-muted">
                            {pick(item.description_ar, item.description_en)}
                          </p>
                        </article>
                      </Reveal>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {drinks.length > 0 ? (
            <Reveal>
              <section className="mt-14 overflow-hidden rounded-lg bg-restaurant-ink text-restaurant-paper sm:mt-20" aria-labelledby="menu-drinks">
                <div className="grid md:grid-cols-2">
                  {drinks[0]?.image_url ? (
                    <img
                      src={mediaUrl(drinks[0].image_url)}
                      alt={pick(drinks[0].name_ar, drinks[0].name_en)}
                      width={1200}
                      height={800}
                      loading="lazy"
                      className="aspect-[4/3] h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="flex flex-col justify-center p-7 sm:p-10">
                    <GlassWater className="size-8 text-restaurant-gold" />
                    <p className="mt-5 text-sm font-semibold text-restaurant-gold">{pick("من البار", "From the bar")}</p>
                    <h2 id="menu-drinks" className="mt-2 text-3xl font-bold">{pick("المشروبات", "Drinks")}</h2>
                    {drinks.map((item) => (
                      <article key={item.id} className="mt-6 border-t border-restaurant-paper/15 pt-5">
                        <h3 className="text-lg font-bold">{pick(item.name_ar, item.name_en)}</h3>
                        <p className="mt-2 text-sm leading-7 text-restaurant-paper/70">{pick(item.description_ar, item.description_en)}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </Reveal>
          ) : null}

          <div className="mt-12 text-center">
            <Link to="/companies" className="text-sm font-semibold text-restaurant-muted hover:text-restaurant-ink">
              ← {t("companies")}
            </Link>
          </div>
        </main>
      </div>
    </SiteLayout>
  );
}
