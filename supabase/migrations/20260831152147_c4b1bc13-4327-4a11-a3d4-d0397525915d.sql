ALTER TABLE public.journey_events
  ADD COLUMN IF NOT EXISTS caption_ar text,
  ADD COLUMN IF NOT EXISTS caption_en text;