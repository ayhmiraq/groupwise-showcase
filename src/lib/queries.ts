import { queryOptions } from "@tanstack/react-query";

import {
  getCompanies,
  getCompany,
  getHomeData,
  getJourney,
  getProduct,
  getProjects,
  getServices,
  getSiteData,
  getStore,
} from "./content.functions";

export const siteQuery = queryOptions({
  queryKey: ["site"],
  queryFn: () => getSiteData(),
  staleTime: 30_000,
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomeData(),
});

export const companiesQuery = queryOptions({
  queryKey: ["companies"],
  queryFn: () => getCompanies(),
});

export const companyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["company", slug],
    queryFn: () => getCompany({ data: { slug } }),
  });

export const servicesQuery = queryOptions({
  queryKey: ["services"],
  queryFn: () => getServices(),
});

export const journeyQuery = queryOptions({
  queryKey: ["journey"],
  queryFn: () => getJourney(),
});

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: () => getProjects(),
});

export const storeQuery = queryOptions({
  queryKey: ["store"],
  queryFn: () => getStore(),
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
  });
