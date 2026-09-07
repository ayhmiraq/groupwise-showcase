import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://awtadalkhima.cbox.uk";

type Entry = { path: string; changefreq?: string; priority?: string };

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
        } catch (error) {
          console.error("sitemap dynamic entries failed", error);
        }

        const urls = entries.map((entry) =>
          [
            "  <url>",
            `    <loc>${BASE_URL}${entry.path}</loc>`,
            entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
            entry.priority ? `    <priority>${entry.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
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
