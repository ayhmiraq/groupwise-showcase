ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS link_type text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS link_url text;