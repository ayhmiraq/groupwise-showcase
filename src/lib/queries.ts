import { queryOptions } from "@tanstack/react-query";

import {
  getCompanies,
  getCompany,
  getGallery,
  getHomeData,
  getJourney,
  getProduct,
  getProjects,
  getServices,
  getSiteData,
  getStore,
} from "./content.functions";
import { withOfflineCache } from "./offline-cache";

export const siteQuery = queryOptions({
  queryKey: ["site"],
  queryFn: withOfflineCache("site", () => getSiteData()),
  staleTime: 60_000,
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: withOfflineCache("home", () => getHomeData()),
});

export const companiesQuery = queryOptions({
  queryKey: ["companies"],
  queryFn: withOfflineCache("companies", () => getCompanies()),
});

export const companyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["company", slug],
    queryFn: withOfflineCache(`company:${slug}`, () => getCompany({ data: { slug } })),
  });

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: withOfflineCache("services", () => getServices()),
});

export const journeyQuery = queryOptions({
  queryKey: ["journey"],
  queryFn: withOfflineCache("journey", () => getJourney()),
});

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: withOfflineCache("projects", () => getProjects()),
});

export const galleryQuery = queryOptions({
  queryKey: ["gallery"],
  queryFn: withOfflineCache("gallery", () => getGallery()),
});

export const storeQuery = queryOptions({
  queryKey: ["store"],
  queryFn: withOfflineCache("store", () => getStore()),
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: withOfflineCache(`product:${slug}`, () => getProduct({ data: { slug } })),
  });
