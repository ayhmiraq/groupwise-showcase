CREATE TABLE public.restaurant_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('oriental', 'western', 'drinks')),
  name_ar text NOT NULL DEFAULT '',
  name_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.restaurant_menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurant_menu_items TO authenticated;
GRANT ALL ON public.restaurant_menu_items TO service_role;

ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant menu public read" ON public.restaurant_menu_items
FOR SELECT TO anon, authenticated USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "restaurant menu admin manage" ON public.restaurant_menu_items
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX restaurant_menu_items_company_idx
ON public.restaurant_menu_items(company_id, category, sort_order);

CREATE TRIGGER restaurant_menu_items_updated
BEFORE UPDATE ON public.restaurant_menu_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.restaurant_menu_items
(company_id, category, name_ar, name_en, description_ar, description_en, image_url, sort_order)
SELECT id, 'oriental', 'المشاوي الحلبية الملكية', 'Royal Aleppo Mixed Grill', 'تشكيلة فاخرة من الكباب واللحم والدجاج المشوي على الفحم مع خبز التنور والخضروات.', 'A generous selection of charcoal-grilled kebab, lamb and chicken with flatbread and vegetables.', '/restaurant/bebon-oriental.jpg', 1
FROM public.companies WHERE slug = 'bebon'
UNION ALL
SELECT id, 'oriental', 'المقبلات الشامية', 'Levantine Mezze', 'حمص ومتبل وفتوش محضّرة يومياً بزيت الزيتون والأعشاب الطازجة.', 'Daily-made hummus, moutabal and fattoush with olive oil and fresh herbs.', NULL, 2
FROM public.companies WHERE slug = 'bebon'
UNION ALL
SELECT id, 'western', 'ستيك ريب آي أنجوس', 'Angus Ribeye Steak', 'قطعة ريب آي مطهوة حسب الطلب، تقدم مع البطاطا المهروسة والهليون وصلصة الفلفل.', 'Ribeye cooked to preference, served with mashed potatoes, asparagus and pepper sauce.', '/restaurant/bebon-western.jpg', 1
FROM public.companies WHERE slug = 'bebon'
UNION ALL
SELECT id, 'western', 'الباستا الإيطالية', 'Italian Truffle Pasta', 'باستا بالكريمة والفطر مع لمسة متوازنة من زيت الكمأة.', 'Creamy mushroom pasta finished with a balanced touch of truffle oil.', NULL, 2
FROM public.companies WHERE slug = 'bebon'
UNION ALL
SELECT id, 'drinks', 'مشروبات بيبون المميزة', 'Bebon Signature Drinks', 'رمان طازج، موهيتو الحمضيات والنعناع، وقهوة عربية محضّرة بعناية.', 'Fresh pomegranate, citrus mint cooler and carefully prepared Arabic coffee.', '/restaurant/bebon-drinks.jpg', 1
FROM public.companies WHERE slug = 'bebon';