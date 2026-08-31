ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS page_bg_type text NOT NULL DEFAULT 'color',
  ADD COLUMN IF NOT EXISTS page_bg_url text,
  ADD COLUMN IF NOT EXISTS page_youtube_id text,
  ADD COLUMN IF NOT EXISTS page_overlay integer NOT NULL DEFAULT 65,
  ADD COLUMN IF NOT EXISTS page_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_subtitle_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_subtitle_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_content_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS page_content_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS timeline_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS timeline_title_en text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_date date;