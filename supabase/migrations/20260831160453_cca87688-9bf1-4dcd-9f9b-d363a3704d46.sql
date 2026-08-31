ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS page_image_url text,
  ADD COLUMN IF NOT EXISTS page_layout text DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS timeline_style text DEFAULT 'line';

ALTER TABLE public.company_timeline
  ADD COLUMN IF NOT EXISTS image_url text;