import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpLeft, PackageOpen } from "lucide-react";
import { useState } from "react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { buildMeta, headSource } from "@/lib/head";
import { formatPrice, useLang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media-url";
import { siteQuery, storeQuery } from "@/lib/queries";

export const Route = createFileRoute("/store/")({
  loader: async ({ context }) => {
    const [site] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(storeQuery),
    ]);
    return headSource(site, "store");
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({
      source: loaderData,
      fallbackName: "مجموعة الشركات",
      fallbackTitle: "المتجر",
      fallbackDescription:
        "كتالوج منتجات المجموعة مع إمكانية طلب استفسار وعرض سعر.",
    }),
  }),
  component: StorePage,
});

function StorePage() {
  const { pick, t, lang } = useLang();
  const { categories, products } = useSuspenseQuery(storeQuery).data;
  const page = usePageSettings("store");
  const [category, setCategory] = useState<string>("all");

  const visible = products.filter((item) => category === "all" || item.category_id === category);

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || "المتجر"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto px-3 py-8 sm:px-4 sm:py-14">
        <div
          className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          role="group"
          aria-label={t("allCategories")}
        >
          <Button
            type="button"
            size="sm"
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
            className="min-h-10 shrink-0 snap-start rounded-lg px-4"
          >
            {t("allCategories")}
          </Button>
          {categories.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={category === item.id ? "default" : "outline"}
              onClick={() => setCategory(item.id)}
              className="min-h-10 shrink-0 snap-start rounded-lg px-4"
            >
              {pick(item.name_ar, item.name_en)}
            </Button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:mt-7 sm:gap-5 lg:grid-cols-4">
          {visible.map((product) => (
            <article
              key={product.id}
              className="card-elevated group flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/70 bg-surface"
            >
              <Link
                to="/store/$slug"
                params={{ slug: product.slug }}
                aria-label={pick(product.name_ar, product.name_en)}
                className="relative block aspect-[4/5] w-full overflow-hidden bg-muted"
              >
                {product.image_url ? (
                  <img
                    src={mediaUrl(product.image_url)}
                    alt={pick(product.name_ar, product.name_en)}
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 359px) calc(100vw - 24px), (max-width: 639px) calc(50vw - 18px), (max-width: 1023px) 50vw, 25vw"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <PackageOpen className="size-9" aria-hidden="true" />
                  </div>
                )}
                <span className="absolute bottom-2 left-2 grid size-9 place-items-center rounded-full border border-border/60 bg-background/90 text-primary-glow shadow-lg backdrop-blur-sm">
                  <ArrowUpLeft className="size-4 rtl:-rotate-90" aria-hidden="true" />
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-3 sm:p-4">
                <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-foreground sm:text-base">
                  {pick(product.name_ar, product.name_en)}
                </h2>
                <p className="mt-1.5 hidden line-clamp-2 text-xs leading-5 text-muted-foreground sm:block">
                  {pick(product.description_ar, product.description_en)}
                </p>
                <div className="mt-auto grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-1.5 pt-3">
                  <span className="min-w-0 break-words text-sm font-bold leading-5 text-primary-glow sm:text-base">
                    {formatPrice(product.price, product.currency, lang, t("onRequest"))}
                  </span>
                  <span
                    className={`shrink-0 rounded-md bg-background/60 px-1.5 py-1 text-[10px] font-semibold sm:text-xs ${
                      product.in_stock ? "text-primary-glow" : "text-destructive"
                    }`}
                  >
                    {product.in_stock ? t("inStock") : t("outOfStock")}
                  </span>
                </div>
                <Button asChild size="sm" className="mt-3 min-h-10 w-full rounded-md text-xs sm:text-sm">
                  <Link to="/store/$slug" params={{ slug: product.slug }}>
                    {t("viewDetails")}
                  </Link>
                </Button>
              </div>
            </article>
          ))}
          {visible.length === 0 ? (
            <div className="col-span-full grid min-h-48 place-items-center rounded-lg border border-dashed border-border text-center">
              <div>
                <PackageOpen className="mx-auto mb-3 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{t("noItems")}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </SiteLayout>
  );
}
