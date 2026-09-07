import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  fetchCompanies,
  fetchCompany,
  fetchGallery,
  fetchHomeData,
  fetchJourney,
  fetchProduct,
  fetchProjects,
  fetchServices,
  fetchSiteData,
  fetchStore,
  insertContactMessage,
  insertInquiry,
} from "./content.server";

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => fetchSiteData());

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => fetchHomeData());

export const getCompanies = createServerFn({ method: "GET" }).handler(async () => fetchCompanies());

export const getCompany = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => fetchCompany(data.slug));

export const getServices = createServerFn({ method: "GET" }).handler(async () => fetchServices());

export const getJourney = createServerFn({ method: "GET" }).handler(async () => fetchJourney());

export const getProjects = createServerFn({ method: "GET" }).handler(async () => fetchProjects());

export const getGallery = createServerFn({ method: "GET" }).handler(async () => fetchGallery());

export const getStore = createServerFn({ method: "GET" }).handler(async () => fetchStore());

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => fetchProduct(data.slug));

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(160).optional().or(z.literal("")),
        phone: z.string().trim().max(40).optional().or(z.literal("")),
        subject: z.string().trim().max(160).optional().or(z.literal("")),
        message: z.string().trim().min(5).max(3000),
      })
      .parse(data),
  )
  .handler(async ({ data }) => insertContactMessage(data));

export const submitInquiry = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        productId: z.string().uuid().nullable().optional(),
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(160).optional().or(z.literal("")),
        phone: z.string().trim().min(5).max(40),
        quantity: z.number().int().min(1).max(100000),
        message: z.string().trim().max(2000).optional().or(z.literal("")),
      })
      .parse(data),
  )
  .handler(async ({ data }) => insertInquiry(data));
