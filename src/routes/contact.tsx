import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/site/PageHero";
import { SiteLayout, usePageSettings, useSiteData } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/content.functions";
import { useLang } from "@/lib/i18n";
import { siteQuery } from "@/lib/queries";

export const Route = createFileRoute("/contact")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(siteQuery);
  },
  head: () => ({
    meta: [
      { title: "التواصل معنا | Contact — Ufuq Group" },
      {
        name: "description",
        content:
          "تواصل مع مجموعة الشركات عبر الهاتف أو البريد الإلكتروني أو نموذج الرسائل. Reach the group by phone, email or the contact form.",
      },
      { property: "og:title", content: "التواصل معنا | Contact — Ufuq Group" },
      {
        property: "og:description",
        content: "أرسل استفسارك وسيتواصل معك فريق المجموعة في أقرب وقت.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { pick, t } = useLang();
  const page = usePageSettings("contact");
  const { settings } = useSiteData();
  const submit = useServerFn(submitContactMessage);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const mutation = useMutation({
    mutationFn: () => submit({ data: form }),
    onSuccess: () => {
      toast.success(t("sent"));
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    },
    onError: () => toast.error(t("failed")),
  });

  return (
    <SiteLayout>
      <PageHero
        page={page}
        compact
        title={pick(page?.title_ar, page?.title_en) || "التواصل معنا"}
        subtitle={pick(page?.subtitle_ar, page?.subtitle_en)}
      />
      <section className="container mx-auto grid gap-10 px-4 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="card-elevated flex items-center gap-3 p-5">
            <Phone className="size-5 text-primary-glow" />
            <span dir="ltr" className="text-sm text-foreground">
              {settings?.phone ?? "—"}
            </span>
          </div>
          <div className="card-elevated flex items-center gap-3 p-5">
            <Mail className="size-5 text-primary-glow" />
            <span dir="ltr" className="text-sm text-foreground">
              {settings?.email ?? "—"}
            </span>
          </div>
          <div className="card-elevated flex items-center gap-3 p-5">
            <MapPin className="size-5 text-primary-glow" />
            <span className="text-sm text-foreground">
              {pick(settings?.address_ar, settings?.address_en)}
            </span>
          </div>
        </div>

        <form
          className="card-elevated space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="c-name">{t("name")}</Label>
              <Input
                id="c-name"
                required
                minLength={2}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-phone">{t("phone")}</Label>
              <Input
                id="c-phone"
                dir="ltr"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-email">{t("email")}</Label>
              <Input
                id="c-email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-subject">{t("subject")}</Label>
              <Input
                id="c-subject"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="c-message">{t("message")}</Label>
            <Textarea
              id="c-message"
              required
              minLength={5}
              rows={6}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
            />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {t("send")}
          </Button>
        </form>
      </section>
    </SiteLayout>
  );
}
