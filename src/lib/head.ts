import type { PageSettings } from "./content.server";

type Settings = {
  group_name_ar?: string | null;
  group_name_en?: string | null;
} | null;

export type HeadSource = {
  settings: Settings;
  page: PageSettings | null;
};

/** Site data a route loader exposes to head() so titles follow the settings. */
export function headSource(
  site: { settings: unknown; pages: PageSettings[] },
  pageKey: string,
): HeadSource {
  return {
    settings: (site.settings ?? null) as Settings,
    page: site.pages.find((page) => page.page_key === pageKey) ?? null,
  };
}

function clean(value: string | null | undefined) {
  const text = (value ?? "").trim();
  return text.length > 0 ? text : undefined;
}

export function groupName(source: HeadSource | undefined, fallback: string) {
  return (
    clean(source?.settings?.group_name_ar) ?? clean(source?.settings?.group_name_en) ?? fallback
  );
}

/**
 * Builds title/description meta from the live settings, so renaming the group
 * or editing a page's texts in the dashboard updates the page metadata too.
 */
export function buildMeta(options: {
  source: HeadSource | undefined;
  fallbackName: string;
  fallbackTitle: string;
  fallbackDescription: string;
  suffix?: boolean;
}) {
  const { source, fallbackName, fallbackTitle, fallbackDescription, suffix = true } = options;
  const name = groupName(source, fallbackName);
  const pageTitle = clean(source?.page?.title_ar) ?? clean(source?.page?.title_en) ?? fallbackTitle;
  const title = suffix ? `${pageTitle} | ${name}` : `${pageTitle}`;
  const description =
    clean(source?.page?.subtitle_ar) ?? clean(source?.page?.subtitle_en) ?? fallbackDescription;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
}
