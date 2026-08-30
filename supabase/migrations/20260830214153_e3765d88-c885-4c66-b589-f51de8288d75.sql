ALTER TABLE public.page_settings
  ADD COLUMN IF NOT EXISTS tile_bg_type TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS tile_bg_url TEXT,
  ADD COLUMN IF NOT EXISTS tile_youtube_id TEXT,
  ADD COLUMN IF NOT EXISTS tile_overlay INTEGER NOT NULL DEFAULT 55;

DO $$ BEGIN
  ALTER TABLE public.page_settings DROP CONSTRAINT IF EXISTS page_settings_tile_bg_type_check;
  ALTER TABLE public.page_settings ADD CONSTRAINT page_settings_tile_bg_type_check
    CHECK (tile_bg_type IN ('none','image','video','youtube'));
END $$;