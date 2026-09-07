CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  caption_ar TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gallery_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT ALL ON public.gallery_images TO service_role;

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gallery_public_read" ON public.gallery_images FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "gallery_admin_all" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX gallery_images_project_idx ON public.gallery_images(project_id, sort_order);