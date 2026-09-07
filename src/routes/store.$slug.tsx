import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitInquiry } from "@/lib/content.functions";
import { formatPrice, useLang } from "@/lib/i18n";
import { productQuery, siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/store/$slug")({
  loader: async ({ context, params }) => {
    const [, product] = await Promise.all([
      context.queryClient.ensureQueryData(siteQuery),
      context.queryClient.ensureQueryData(productQuery(params.slug)),
    ]);
    if (!product) throw notFound();
    return {
      slug: params.slug,
      name: product.product.name_ar,
      description: product.product.description_ar,
      image: product.product.image_url ?? null,
      price: product.product.price ?? null,
      currency: product.product.currency ?? null,
      inStock: product.product.in_stock ?? true,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "غير متوفر | Unavailable" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.name} | المتجر — Ufuq Group`;
    const description = (loaderData.description ?? "").slice(0, 155) || "منتج من متجر المجموعة.";
    const url = `https://awtadalkhima.cbox.uk/store/${encodeURIComponent(loaderData.slug)}`;
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: loaderData.name,
      description,
      url,
    };
    if (loaderData.image?.startsWith("http")) jsonLd["image"] = loaderData.image;
    jsonLd["offers"] = {
      "@type": "Offer",
      url,
      availability: loaderData.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      ...(loaderData.price != null && loaderData.currency
        ? { price: String(loaderData.price), priceCurrency: loaderData.currency }
        : {}),
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { pick, t, lang } = useLang();
  const data = useSuspenseQuery(productQuery(slug)).data;
  const submit = useServerFn(submitInquiry);
  const [form, setForm] = useState({ name: "", email: "", phone: "", quantity: 1, message: "" });

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          productId: data?.product.id ?? null,
          name: form.name,
          email: form.email,
          phone: form.phone,
          quantity: Number(form.quantity) || 1,
          message: form.message,
        },
      }),
    onSuccess: () => {
      toast.success(t("sent"));
      setForm({ name: "", email: "", phone: "", quantity: 1, message: "" });
    },
    onError: () => toast.error(t("failed")),
  });

  if (!data) return null;
  const { product, images, category } = data;
  const gallery = [product.image_url, ...images.map((image) => image.image_url)].filter(
    Boolean,
  ) as string[];

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-14">
        <Link to="/store" className="text-sm text-primary-glow hover:underline">
          ← {t("backToStore")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {gallery[0] ? (
              <img
                src={gallery[0]}
                alt={pick(product.name_ar, product.name_en)}
                className="w-full rounded-xl object-cover"
              />
            ) : null}
            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {gallery.slice(1).map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt=""
                    className="h-20 w-full rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div>
            {category ? (
              <p className="text-sm font-semibold text-primary-glow">
                {pick(category.name_ar, category.name_en)}
              </p>
            ) : null}
            <h1 className="mt-1 text-3xl font-bold text-foreground">
              {pick(product.name_ar, product.name_en)}
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {pick(product.description_ar, product.description_en)}
            </p>
            <p className="mt-5 text-2xl font-bold text-primary-glow">
              {formatPrice(product.price, product.currency, lang, t("onRequest"))}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("status")}: {product.in_stock ? t("inStock") : t("outOfStock")}
            </p>

            <form
              className="card-elevated mt-8 space-y-4 p-6"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <h2 className="text-lg font-bold text-foreground">{t("requestQuote")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    required
                    minLength={2}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    required
                    dir="ltr"
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">{t("quantity")}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: Number(event.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  rows={3}
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                />
              </div>
              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {t("send")}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
