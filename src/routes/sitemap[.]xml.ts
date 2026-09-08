import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { absoluteMedia } from "@/lib/structured-data";

const BASE_URL = "https://awtadalkhima.cbox.uk";

type SitemapImage = { loc: string; title?: string | undefined; caption?: string | undefined };
type Entry = {
  path: string;
  changefreq?: string;
  priority?: string;
  images?: SitemapImage[];
};

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function firstText(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: Entry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/companies", changefreq: "weekly", priority: "0.8" },
          { path: "/services", changefreq: "monthly", priority: "0.7" },
          { path: "/journey", changefreq: "monthly", priority: "0.6" },
          { path: "/projects", changefreq: "weekly", priority: "0.7" },
          { path: "/gallery", changefreq: "weekly", priority: "0.6" },
          { path: "/store", changefreq: "weekly", priority: "0.8" },
          { path: "/contact", changefreq: "yearly", priority: "0.5" },
        ];

        const projectsEntry = entries.find((entry) => entry.path === "/projects")!;
        const galleryEntry = entries.find((entry) => entry.path === "/gallery")!;

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env["SUPABASE_URL"]!,
            process.env["SUPABASE_PUBLISHABLE_KEY"]!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );

          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("companies")
              .select("slug")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            entries.push(
              ...(data ?? [])
                .filter((row) => Boolean(row.slug))
                .map((row) => ({ path: `/companies/${encodeURIComponent(row.slug as string)}` })),
            );
            if (!data || data.length < pageSize) break;
          }

          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("products")
              .select("slug")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            entries.push(
              ...(data ?? [])
                .filter((row) => Boolean(row.slug))
                .map((row) => ({ path: `/store/${encodeURIComponent(row.slug as string)}` })),
            );
            if (!data || data.length < pageSize) break;
          }

          // Project cover images belong to /projects.
          const { data: projectRows, error: projectError } = await supabase
            .from("projects")
            .select("title_ar,title_en,description_ar,description_en,image_url")
            .eq("published", true)
            .order("sort_order");
          if (projectError) throw projectError;
          const projectImages: SitemapImage[] = [];
          for (const row of projectRows ?? []) {
            const loc = absoluteMedia(row.image_url);
            if (!loc) continue;
            projectImages.push({
              loc,
              title: firstText(row.title_ar, row.title_en),
              caption: firstText(row.description_ar, row.description_en)?.slice(0, 200),
            });
          }
          projectsEntry.images = projectImages;

          // Gallery photos belong to /gallery, and project-linked ones also to /projects.
          const { data: imageRows, error: imageError } = await supabase
            .from("gallery_images")
            .select("image_url,title_ar,title_en,caption_ar,caption_en,project_id")
            .eq("published", true)
            .order("sort_order");
          if (imageError) throw imageError;
          const galleryImages: SitemapImage[] = [];
          for (const row of imageRows ?? []) {
            const loc = absoluteMedia(row.image_url);
            if (!loc) continue;
            const image: SitemapImage = {
              loc,
              title: firstText(row.title_ar, row.title_en),
              caption: firstText(row.caption_ar, row.caption_en)?.slice(0, 200),
            };
            galleryImages.push(image);
            if (row.project_id) projectImages.push(image);
          }
          galleryEntry.images = galleryImages;
        } catch (error) {
          console.error("sitemap dynamic entries failed", error);
        }

        const urls = entries.map((entry) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${entry.path}</loc>`,
            entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
            entry.priority ? `    <priority>${entry.priority}</priority>` : null,
            ...(entry.images ?? []).slice(0, 1000).map((image) =>
              [
                "    <image:image>",
                `      <image:loc>${xmlEscape(image.loc)}</image:loc>`,
                image.title ? `      <image:title>${xmlEscape(image.title)}</image:title>` : null,
                image.caption
                  ? `      <image:caption>${xmlEscape(image.caption)}</image:caption>`
                  : null,
                "    </image:image>",
              ]
                .filter(Boolean)
                .join("\n"),
            ),
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
          '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
