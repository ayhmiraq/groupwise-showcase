-- roles
CREATE TYPE public.app_role AS ENUM ('admin','editor','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- site settings (single row)
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  group_name_ar text NOT NULL DEFAULT 'مجموعة شركات',
  group_name_en text NOT NULL DEFAULT 'Group of Companies',
  logo_url text,
  topbar_text_ar text,
  topbar_text_en text,
  phone text,
  email text,
  address_ar text,
  address_en text,
  whatsapp text,
  facebook text,
  instagram text,
  linkedin text,
  youtube text,
  footer_note_ar text,
  footer_note_en text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- per page design settings
CREATE TABLE public.page_settings (
  page_key text PRIMARY KEY,
  title_ar text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  subtitle_ar text NOT NULL DEFAULT '',
  subtitle_en text NOT NULL DEFAULT '',
  bg_type text NOT NULL DEFAULT 'color',
  bg_url text,
  youtube_id text,
  overlay int NOT NULL DEFAULT 65,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_settings_bg_type_check CHECK (bg_type IN ('color','image','video','youtube')),
  CONSTRAINT page_settings_overlay_check CHECK (overlay BETWEEN 0 AND 95)
);
GRANT SELECT ON public.page_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.page_settings TO authenticated;
GRANT ALL ON public.page_settings TO service_role;
ALTER TABLE public.page_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read page settings" ON public.page_settings FOR SELECT USING (true);
CREATE POLICY "admins manage page settings" ON public.page_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER page_settings_updated BEFORE UPDATE ON public.page_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  tagline_ar text DEFAULT '',
  tagline_en text DEFAULT '',
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  image_url text,
  founded_date date,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published companies" ON public.companies FOR SELECT USING (published);
CREATE POLICY "admins manage companies" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.company_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_timeline TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_timeline TO authenticated;
GRANT ALL ON public.company_timeline TO service_role;
ALTER TABLE public.company_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read company timeline" ON public.company_timeline FOR SELECT USING (true);
CREATE POLICY "admins manage company timeline" ON public.company_timeline FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  icon text DEFAULT 'Building2',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published services" ON public.services FOR SELECT USING (published);
CREATE POLICY "admins manage services" ON public.services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- journey
CREATE TABLE public.journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_date date NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.journey_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_events TO authenticated;
GRANT ALL ON public.journey_events TO service_role;
ALTER TABLE public.journey_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published journey" ON public.journey_events FOR SELECT USING (published);
CREATE POLICY "admins manage journey" ON public.journey_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER journey_updated BEFORE UPDATE ON public.journey_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  location_ar text DEFAULT '',
  location_en text DEFAULT '',
  image_url text,
  status text NOT NULL DEFAULT 'completed',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_status_check CHECK (status IN ('planned','ongoing','completed'))
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published projects" ON public.projects FOR SELECT USING (published);
CREATE POLICY "admins manage projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- store
CREATE TABLE public.store_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_categories TO authenticated;
GRANT ALL ON public.store_categories TO service_role;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.store_categories FOR SELECT USING (true);
CREATE POLICY "admins manage categories" ON public.store_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.store_categories(id) ON DELETE SET NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text DEFAULT '',
  description_en text DEFAULT '',
  price numeric(12,2),
  currency text NOT NULL DEFAULT 'IQD',
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published products" ON public.products FOR SELECT USING (published);
CREATE POLICY "admins manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "admins manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- inquiries and messages
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inquiries_status_check CHECK (status IN ('new','in_progress','done','archived'))
);
GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit inquiry" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read inquiries" ON public.inquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update inquiries" ON public.inquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete inquiries" ON public.inquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_status_check CHECK (status IN ('new','in_progress','done','archived'))
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update messages" ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- storage policies for the media bucket
CREATE POLICY "admins read media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins upload media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));

-- seed
INSERT INTO public.site_settings (id, group_name_ar, group_name_en, topbar_text_ar, topbar_text_en, phone, email, address_ar, address_en, whatsapp, facebook, instagram, linkedin, youtube, footer_note_ar, footer_note_en)
VALUES (1,'مجموعة الأفق','Al Ufuq Group','نبني المستقبل منذ 1998','Building the future since 1998','+964 770 000 0000','info@alufuq-group.com','بغداد - العراق','Baghdad, Iraq','+9647700000000','https://facebook.com','https://instagram.com','https://linkedin.com','https://youtube.com','مجموعة شركات رائدة في الإنشاءات والصناعة والتقنية.','A leading group in construction, industry and technology.');

INSERT INTO public.page_settings (page_key,title_ar,title_en,subtitle_ar,subtitle_en,bg_type,youtube_id,overlay) VALUES
('home','مجموعة الأفق','Al Ufuq Group','مجموعة شركات تعمل في الإنشاءات والصناعة والتقنية والتجارة','A group of companies in construction, industry, technology and trade','youtube','ScMzIvxBSi4',70),
('services','خدماتنا','Our Services','حلول متكاملة تغطي دورة المشروع من الفكرة حتى التسليم','Integrated solutions covering the full project lifecycle','color',NULL,65),
('journey','مسيرتنا','Our Journey','محطات ومنجزات صنعت تاريخ المجموعة','Milestones that shaped our history','color',NULL,65),
('projects','المشاريع','Projects','نماذج من أعمالنا المنفذة والجاري تنفيذها','Selected delivered and ongoing works','color',NULL,65),
('store','المتجر','Store','منتجات المجموعة مع إمكانية طلب عرض سعر','Group products with quotation requests','color',NULL,65),
('contact','التواصل معنا','Contact Us','فريقنا جاهز للإجابة على استفساراتكم','Our team is ready to answer your questions','color',NULL,65),
('companies','شركاتنا','Our Companies','الشركات التابعة للمجموعة','Companies within the group','color',NULL,65);

INSERT INTO public.companies (slug,name_ar,name_en,tagline_ar,tagline_en,description_ar,description_en,image_url,founded_date,sort_order) VALUES
('ufuq-construction','الأفق للإنشاءات','Ufuq Construction','مقاولات عامة وأبنية','General contracting & buildings','تنفيذ المشاريع السكنية والتجارية والبنى التحتية بمعايير عالمية.','Delivering residential, commercial and infrastructure projects to global standards.','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80','1998-03-01',1),
('ufuq-industry','الأفق للصناعة','Ufuq Industry','مواد بناء وصناعات تحويلية','Building materials & manufacturing','مصانع لإنتاج مواد البناء والمنتجات المعدنية عالية الجودة.','Plants producing high quality building materials and metal products.','https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80','2005-06-15',2),
('ufuq-tech','الأفق للتقنية','Ufuq Technology','حلول رقمية وأنظمة ذكية','Digital solutions & smart systems','تطوير الأنظمة والبرمجيات وحلول المدن والمباني الذكية.','Software, systems and smart building solutions.','https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80','2014-09-01',3),
('ufuq-trade','الأفق للتجارة','Ufuq Trading','استيراد وتوزيع','Import & distribution','استيراد وتوزيع المعدات والمواد الصناعية لمختلف القطاعات.','Import and distribution of industrial equipment and materials.','https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80','2010-01-20',4);

INSERT INTO public.company_timeline (company_id,event_date,title_ar,title_en,description_ar,description_en,sort_order)
SELECT id,'1998-03-01'::date,'التأسيس','Founded','بداية العمل بفريق صغير في بغداد.','Started with a small team in Baghdad.',1 FROM public.companies WHERE slug='ufuq-construction'
UNION ALL SELECT id,'2007-05-10'::date,'أول مشروع كبير','First major project','تنفيذ مجمع سكني من 300 وحدة.','Delivered a 300-unit residential compound.',2 FROM public.companies WHERE slug='ufuq-construction'
UNION ALL SELECT id,'2019-11-01'::date,'شهادة الجودة','Quality certification','الحصول على شهادة ISO 9001.','Obtained ISO 9001 certification.',3 FROM public.companies WHERE slug='ufuq-construction'
UNION ALL SELECT id,'2005-06-15'::date,'افتتاح المصنع الأول','First plant opened','خط إنتاج للطوب والخرسانة الجاهزة.','Bricks and ready-mix concrete line.',1 FROM public.companies WHERE slug='ufuq-industry'
UNION ALL SELECT id,'2016-04-01'::date,'توسعة الإنتاج','Production expansion','مضاعفة الطاقة الإنتاجية ثلاث مرات.','Tripled production capacity.',2 FROM public.companies WHERE slug='ufuq-industry'
UNION ALL SELECT id,'2014-09-01'::date,'انطلاق الشركة','Company launch','فريق تطوير برمجيات متخصص.','A dedicated software development team.',1 FROM public.companies WHERE slug='ufuq-tech'
UNION ALL SELECT id,'2022-02-01'::date,'منصة المدن الذكية','Smart city platform','إطلاق منصة إدارة المرافق.','Launched a facilities management platform.',2 FROM public.companies WHERE slug='ufuq-tech'
UNION ALL SELECT id,'2010-01-20'::date,'بداية الاستيراد','Import operations','عقود توزيع مع موردين عالميين.','Distribution contracts with global suppliers.',1 FROM public.companies WHERE slug='ufuq-trade';

INSERT INTO public.services (title_ar,title_en,description_ar,description_en,icon,sort_order) VALUES
('المقاولات العامة','General Contracting','تنفيذ المشاريع بأنظمة إدارة حديثة وجدول زمني مضمون.','Project delivery with modern management and guaranteed schedules.','Building2',1),
('التصميم والإشراف','Design & Supervision','دراسات وتصاميم هندسية وإشراف على التنفيذ.','Engineering studies, design and construction supervision.','Ruler',2),
('البنى التحتية','Infrastructure','طرق وجسور وشبكات مياه وصرف وكهرباء.','Roads, bridges, water, sewage and power networks.','Route',3),
('الصناعة والتوريد','Industry & Supply','إنتاج وتوريد مواد البناء والمعدات.','Production and supply of materials and equipment.','Factory',4),
('الحلول التقنية','Technology Solutions','أنظمة إدارة ومنصات رقمية ومباني ذكية.','Management systems, digital platforms and smart buildings.','Cpu',5),
('إدارة المشاريع','Project Management','إدارة كلفة وجودة ومخاطر المشاريع.','Cost, quality and risk management.','ClipboardCheck',6);

INSERT INTO public.journey_events (event_date,title_ar,title_en,description_ar,description_en,sort_order) VALUES
('1998-03-01','تأسيس المجموعة','Group founded','انطلاق العمل بشركة إنشاءات واحدة.','Started with a single construction company.',1),
('2005-06-15','دخول قطاع الصناعة','Entering industry','تأسيس شركة الأفق للصناعة.','Ufuq Industry established.',2),
('2010-01-20','التوسع التجاري','Trade expansion','تأسيس شركة الأفق للتجارة.','Ufuq Trading established.',3),
('2014-09-01','التحول الرقمي','Digital transformation','تأسيس شركة الأفق للتقنية.','Ufuq Technology established.',4),
('2019-11-01','شهادات الجودة','Quality certifications','اعتماد أنظمة الجودة العالمية.','Adopted international quality systems.',5),
('2024-05-01','أكثر من 250 مشروع','250+ projects','تسليم أكثر من 250 مشروعاً.','More than 250 projects delivered.',6);

INSERT INTO public.projects (slug,title_ar,title_en,description_ar,description_en,location_ar,location_en,image_url,status,start_date,end_date,sort_order) VALUES
('al-ufuq-towers','أبراج الأفق','Al Ufuq Towers','مجمع سكني من ثلاثة أبراج بمساحة 45 ألف م².','A three-tower residential complex over 45,000 m².','بغداد','Baghdad','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80','completed','2018-01-01','2021-06-01',1),
('industrial-park','المدينة الصناعية','Industrial Park','بنية تحتية متكاملة لمنطقة صناعية.','Full infrastructure for an industrial zone.','البصرة','Basra','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80','ongoing','2023-03-01',NULL,2),
('smart-campus','الحرم الذكي','Smart Campus','حلول مبانٍ ذكية لحرم جامعي.','Smart building solutions for a university campus.','أربيل','Erbil','https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80','completed','2020-09-01','2022-12-01',3),
('ring-road','الطريق الحلقي','Ring Road','تنفيذ 18 كم من الطرق والجسور.','18 km of roads and bridges.','النجف','Najaf','https://images.unsplash.com/photo-1545459720-aac8509eb02c?w=1200&q=80','planned','2026-01-01',NULL,4);

INSERT INTO public.store_categories (slug,name_ar,name_en,sort_order) VALUES
('building-materials','مواد بناء','Building Materials',1),
('equipment','معدات','Equipment',2),
('smart-systems','أنظمة ذكية','Smart Systems',3);

INSERT INTO public.products (slug,category_id,name_ar,name_en,description_ar,description_en,price,currency,image_url,featured,sort_order)
SELECT 'ready-mix-concrete', c.id,'خرسانة جاهزة','Ready-Mix Concrete','خرسانة بمقاومات مختلفة مع خدمة الصب.','Concrete in multiple grades with pumping service.',150000,'IQD','https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80',true,1 FROM public.store_categories c WHERE c.slug='building-materials'
UNION ALL SELECT 'insulation-blocks', c.id,'بلوك عازل','Insulating Blocks','بلوك خفيف عالي العزل الحراري.','Lightweight blocks with high thermal insulation.',2500,'IQD','https://images.unsplash.com/photo-1590986318327-27bab8fa4c22?w=1200&q=80',false,2 FROM public.store_categories c WHERE c.slug='building-materials'
UNION ALL SELECT 'tower-crane', c.id,'رافعة برجية','Tower Crane','رافعات للإيجار أو البيع بحمولات مختلفة.','Cranes for rent or sale in various capacities.',NULL,'IQD','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80',true,3 FROM public.store_categories c WHERE c.slug='equipment'
UNION ALL SELECT 'concrete-mixer', c.id,'خلاطة خرسانة','Concrete Mixer','خلاطات بسعات 350 و 500 لتر.','Mixers with 350 and 500 litre capacity.',1750000,'IQD','https://images.unsplash.com/photo-1503387837-b154d5074bd2?w=1200&q=80',false,4 FROM public.store_categories c WHERE c.slug='equipment'
UNION ALL SELECT 'bms-package', c.id,'نظام إدارة المباني','Building Management System','باقة أجهزة وبرمجيات لإدارة المباني.','Hardware and software package for building management.',NULL,'IQD','https://images.unsplash.com/photo-1558002038-1055907df827?w=1200&q=80',true,5 FROM public.store_categories c WHERE c.slug='smart-systems'
UNION ALL SELECT 'solar-kit', c.id,'منظومة طاقة شمسية','Solar Power Kit','منظومات بقدرات من 5 إلى 50 كيلوواط.','Systems from 5 kW to 50 kW.',4500000,'IQD','https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',false,6 FROM public.store_categories c WHERE c.slug='smart-systems';