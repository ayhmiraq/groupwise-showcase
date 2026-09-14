CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  address_ar TEXT NOT NULL DEFAULT '',
  address_en TEXT NOT NULL DEFAULT '',
  phone TEXT,
  google_maps_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published branches" ON public.branches
  FOR SELECT USING (published = true);

CREATE POLICY "Admins can manage branches" ON public.branches
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed a default branch from the current site address if it exists
INSERT INTO public.branches (name_ar, name_en, address_ar, address_en, phone)
SELECT 'الفرع الرئيسي',
       'Main Branch',
       COALESCE(address_ar, ''),
       COALESCE(address_en, ''),
       phone
FROM public.site_settings
WHERE id = 1
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();