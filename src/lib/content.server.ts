import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

export type PageSettings = {
  page_key: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  bg_type: string;
  bg_url: string | null;
  youtube_id: string | null;
  overlay: number;
  enabled: boolean;
  fx_enabled?: boolean;
  fx_density?: number;
  fx_speed?: number;
  fx_hue?: number;
  fx_glow?: number;
  fx_grid?: boolean;
  fx_scan?: boolean;
  tile_bg_type?: string;
  tile_bg_url?: string | null;
  tile_youtube_id?: string | null;
  tile_overlay?: number;
};

export async function fetchSiteData() {
  const supabase = publicClient();
  const [settings, pages] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("page_settings").select("*"),
  ]);

  return {
    settings: settings.data ?? null,
    pages: (pages.data ?? []) as PageSettings[],
  };
}

export async function fetchCompanies() {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHomeData() {
  const supabase = publicClient();
  const [companies, services, projects] = await Promise.all([
    supabase.from("companies").select("*").order("sort_order", { ascending: true }),
    supabase.from("services").select("*").order("sort_order", { ascending: true }).limit(6),
    supabase.from("projects").select("*").order("sort_order", { ascending: true }).limit(3),
  ]);
  return {
    companies: companies.data ?? [],
    services: services.data ?? [],
    projects: projects.data ?? [],
  };
}

export async function fetchCompany(slug: string) {
  const supabase = publicClient();
  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!company) return null;
  const [timeline, projects] = await Promise.all([
    supabase
      .from("company_timeline")
      .select("*")
      .eq("company_id", company.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("projects")
      .select("*")
      .eq("company_id", company.id)
      .order("sort_order", { ascending: true }),
  ]);
  return { company, timeline: timeline.data ?? [], projects: projects.data ?? [] };
}

export async function fetchServices() {
  const supabase = publicClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function fetchJourney() {
  const supabase = publicClient();
  const { data } = await supabase
    .from("journey_events")
    .select("*")
    .order("event_date", { ascending: true });
  return data ?? [];
}

export async function fetchProjects() {
  const supabase = publicClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function fetchGallery() {
  const supabase = publicClient();
  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function fetchStore() {
  const supabase = publicClient();
  const [categories, products] = await Promise.all([
    supabase.from("store_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("products").select("*").order("sort_order", { ascending: true }),
  ]);
  return { categories: categories.data ?? [], products: products.data ?? [] };
}

export async function fetchProduct(slug: string) {
  const supabase = publicClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!product) return null;
  const [images, category] = await Promise.all([
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    product.category_id
      ? supabase.from("store_categories").select("*").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { product, images: images.data ?? [], category: category.data ?? null };
}

export async function insertContactMessage(input: {
  name: string;
  email?: string | undefined;
  phone?: string | undefined;
  subject?: string | undefined;
  message: string;
}) {
  const supabase = publicClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    subject: input.subject || "",
    message: input.message,
  });
  if (error) throw new Error("could_not_submit_message");
  return { ok: true };
}

export async function insertInquiry(input: {
  productId?: string | null | undefined;
  name: string;
  email?: string | undefined;
  phone: string;
  quantity: number;
  message?: string | undefined;
}) {
  const supabase = publicClient();
  const { error } = await supabase.from("inquiries").insert({
    product_id: input.productId ?? null,
    name: input.name,
    email: input.email || null,
    phone: input.phone,
    quantity: input.quantity,
    message: input.message || "",
  });
  if (error) throw new Error("could_not_submit_inquiry");
  return { ok: true };
}
