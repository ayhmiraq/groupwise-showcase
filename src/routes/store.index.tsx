import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings } from "@/components/site/SiteLayout";
import { formatPrice, useLang } from "@/lib/i18n";
import { siteQuery, storeQuery } from "@/lib/queries";

export const Route = createFileRoute("/store/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(storeQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "المتجر | Store — Ufuq Group" },
      {
        name: "description",
        content:
          "كتالوج منتجات المجموعة مع إمكانية طلب استفسار وعرض سعر. Browse the group's product catalogue and request a quote.",
      },
      { property: "og:title", content: "المتجر | Store — Ufuq Group" },
      {
        property: "og:description",
        content: "منتجات وحلول المجموعة مصنفة بحسب الأقسام مع طلب عرض سعر.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
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
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              category === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                category === item.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {pick(item.name_ar, item.name_en)}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <article key={product.id} className="card-elevated overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={pick(product.name_ar, product.name_en)}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="p-5">
                <h2 className="text-lg font-bold text-foreground">
                  {pick(product.name_ar, product.name_en)}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {pick(product.description_ar, product.description_en)}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="font-bold text-primary-glow">
                    {formatPrice(product.price, product.currency, lang, t("onRequest"))}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      product.in_stock ? "text-primary-glow" : "text-destructive"
                    }`}
                  >
                    {product.in_stock ? t("inStock") : t("outOfStock")}
                  </span>
                </div>
                <Link
                  to="/store/$slug"
                  params={{ slug: product.slug }}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("viewDetails")}
                </Link>
              </div>
            </article>
          ))}
          {visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noItems")}</p>
          ) : null}
        </div>
      </section>
    </SiteLayout>
  );
}
