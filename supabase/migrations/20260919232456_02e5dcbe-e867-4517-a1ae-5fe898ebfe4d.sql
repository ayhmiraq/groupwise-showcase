DROP POLICY "restaurant menu public read" ON public.restaurant_menu_items;
CREATE POLICY "restaurant menu public read" ON public.restaurant_menu_items
FOR SELECT TO anon, authenticated USING (published = true);