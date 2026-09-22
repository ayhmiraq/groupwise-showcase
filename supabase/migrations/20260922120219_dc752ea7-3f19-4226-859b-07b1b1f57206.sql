CREATE TABLE public.db_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  supabase_url text NOT NULL DEFAULT '',
  service_key text NOT NULL DEFAULT '',
  anon_key text,
  notes text,
  is_active boolean NOT NULL DEFAULT false,
  last_status text,
  last_tested_at timestamp with time zone,
  last_copy_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.db_targets TO authenticated;
GRANT ALL ON public.db_targets TO service_role;

ALTER TABLE public.db_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage db targets" ON public.db_targets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER db_targets_updated
  BEFORE UPDATE ON public.db_targets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();