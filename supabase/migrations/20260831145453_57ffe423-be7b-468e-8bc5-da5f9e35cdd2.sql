ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tile_bg_type text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS tile_bg_url text,
  ADD COLUMN IF NOT EXISTS tile_youtube_id text,
  ADD COLUMN IF NOT EXISTS tile_overlay integer;