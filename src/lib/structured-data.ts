/**
 * JSON-LD builders for the projects page and the photo gallery.
 *
 * Search engines only accept absolute, publicly reachable URLs, so every
 * image/media link is normalized here and anything relative is dropped.
 */
export const SITE_URL = "https://awtadalkhima.cbox.uk";

export type SdProject = {
  slug?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  location_ar?: string | null;
  location_en?: string | null;
  image_url?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type SdImage = {
  id: string;
  image_url: string;
  title_ar?: string | null;
  title_en?: string | null;
  caption_ar?: string | null;
  caption_en?: string | null;
  project_id?: string | null;
};

function text(...values: (string | null | undefined)[]) {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/** Only absolute http(s) links are usable in structured data / sitemaps. */
export function absoluteMedia(raw?: string | null): string | undefined {
  const url = (raw ?? "").trim();
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return undefined;
}

/** ItemList of every published project, each one a schema.org Project. */
export function projectsJsonLd(projects: SdProject[], images: SdImage[] = []) {
  const pageUrl = `${SITE_URL}/projects`;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "مشاريع المجموعة",
    url: pageUrl,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => {
      const name = text(project.title_ar, project.title_en) ?? `مشروع ${index + 1}`;
      const projectImages = [
        absoluteMedia(project.image_url),
        ...images
          .filter((image) => image.project_id && image.project_id === (project as { id?: string }).id)
          .map((image) => absoluteMedia(image.image_url)),
      ].filter((url): url is string => Boolean(url));

      const item: Record<string, unknown> = {
        "@type": "Project",
        name,
        url: pageUrl,
      };
      const description = text(project.description_ar, project.description_en);
      if (description) item["description"] = description.slice(0, 300);
      if (projectImages.length > 0) item["image"] = projectImages;
      const location = text(project.location_ar, project.location_en);
      if (location) item["location"] = { "@type": "Place", name: location };
      if (project.start_date) item["startDate"] = project.start_date;
      if (project.end_date) item["endDate"] = project.end_date;
      if (project.status) item["additionalProperty"] = {
        "@type": "PropertyValue",
        name: "status",
        value: project.status,
      };

      return { "@type": "ListItem", position: index + 1, item };
    }),
  };
}

/** ImageGallery whose associatedMedia holds one ImageObject per photo. */
export function galleryJsonLd(images: SdImage[], pagePath = "/gallery") {
  const pageUrl = `${SITE_URL}${pagePath}`;
  const media = images
    .map((image) => {
      const url = absoluteMedia(image.image_url);
      if (!url) return null;
      const entry: Record<string, unknown> = {
        "@type": "ImageObject",
        contentUrl: url,
        url,
        representativeOfPage: false,
      };
      const name = text(image.title_ar, image.title_en);
      const caption = text(image.caption_ar, image.caption_en);
      if (name) entry["name"] = name;
      if (caption) entry["caption"] = caption;
      entry["description"] =
        caption ?? name ?? "صورة من مكتبة صور أعمال ومشاريع المجموعة";
      return entry;
    })
    .filter((entry): entry is Record<string, unknown> => Boolean(entry));

  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: "مكتبة الصور",
    url: pageUrl,
    numberOfItems: media.length,
    associatedMedia: media,
  };
}
