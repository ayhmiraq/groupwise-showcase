INSERT INTO public.page_settings (page_key, title_ar, title_en, subtitle_ar, subtitle_en)
VALUES ('gallery', 'مكتبة الصور', 'Gallery', 'صور من مشاريعنا وأعمالنا', 'Photos from our projects and works')
ON CONFLICT (page_key) DO NOTHING;