# دليل نقل المشروع إلى Supabase Self-Hosted على VPS

هذا الملف موجّه للمطور المسؤول عن التنفيذ. كل ما يلزم النقل متاح من داخل الموقع نفسه
(لوحة التحكم → **تفاصيل الخادم**، أو صفحة **/installdb**) ولا يحتاج وصولاً إلى لوحة Supabase Cloud.

---

## 1. ما يجب تنزيله من الموقع (بحساب المدير)

| الملف | من أين | يحتوي على |
|---|---|---|
| `backup-<التاريخ>.sql` | تفاصيل الخادم → «تنزيل نسخة احتياطية الآن» (نفس الملف في /installdb) | Extensions، Enums، كل الجداول + البيانات، Constraints و Foreign Keys، Indexes، Functions، Triggers، Grants، تشغيل RLS + كل الـPolicies (public و storage)، صفوف `auth.users` و `auth.identities` بكلمات المرور المشفّرة، صفوف `storage.buckets` و `storage.objects` |
| `storage-migrate-<التاريخ>.sh` | تفاصيل الخادم → «تنزيل سكربت نقل الملفات» | سكربت Bash ينزّل كل ملفات حاوية `media` فعلياً (روابط موقّعة صالحة 7 أيام) ثم يرفعها إلى الخادم الجديد، وينشئ الحاويات بنفس إعداداتها |
| مجلد `supabase/migrations/` (23 ملفاً) | من مستودع الكود | التاريخ الكامل للهجرات — مفيد للرجوع، وليس ضرورياً للتشغيل لأن `backup.sql` يحتوي الحالة النهائية |
| مجلد الكود كاملاً | المستودع | التطبيق نفسه |

> ملاحظة: الروابط الموقّعة داخل سكربت التخزين تنتهي بعد 7 أيام — نزّل السكربت وشغّله خلال المدة، أو أعد تنزيله.

---

## 2. ترتيب التنفيذ على الـVPS

1. **شغّل Supabase Self-Hosted أولاً** (docker compose الرسمي) حتى تُنشأ مخططات `auth` و `storage` و `realtime` بواسطة خدمات GoTrue و Storage. الاستيراد قبل ذلك سيفشل.
2. استورد قاعدة البيانات:
   ```bash
   psql "postgresql://postgres:<PASSWORD>@<HOST>:5432/postgres" -f backup-<التاريخ>.sql
   ```
   الملف يبدأ بـ `SET session_replication_role = replica;` لتجاوز ترتيب المفاتيح الأجنبية، ويعيدها في النهاية. وكل العناصر مكتوبة بصيغة `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` فيمكن تشغيله أكثر من مرة بأمان.
3. انقل الملفات:
   ```bash
   # عدّل أول السكربت: NEW_URL و NEW_SERVICE_KEY لخادمك الجديد
   bash storage-migrate-<التاريخ>.sh
   ```
4. تحقق: عدد الصفوف في الجداول، ظهور الصور، وتسجيل الدخول بحساب المدير.

---

## 3. المستخدمون وتسجيل الدخول

- عدد المستخدمين الحالي: **1** (حساب المدير) ولديه كلمة مرور.
- `backup.sql` ينقل `auth.users` و `auth.identities` **بما فيها `encrypted_password`** (bcrypt)، لذا تعمل نفس كلمة المرور على الخادم الجديد بدون إعادة تعيين.
- الأدوار (`public.user_roles` + `app_role` enum + دالة `has_role`) تُنقل ضمن الجداول والدوال، فتبقى صلاحية المدير كما هي.
- **ما لا يُنقل تلقائياً:** إعدادات GoTrue نفسها. اضبطها يدوياً في `.env` لـ docker compose:
  - `GOTRUE_SITE_URL` و `GOTRUE_URI_ALLOW_LIST` (نطاق موقعك الجديد)
  - تمكين الدخول بالبريد وكلمة المرور: `GOTRUE_EXTERNAL_EMAIL_ENABLED=true`
  - تأكيد البريد: `GOTRUE_MAILER_AUTOCONFIRM` (الحسابات المنقولة مؤكَّدة مسبقاً في البيانات)
  - إعدادات SMTP لرسائل التأكيد/استعادة كلمة المرور
  - مدة الجلسة: `GOTRUE_JWT_EXP`
  - لا يستخدم المشروع حالياً أي مزوّد دخول اجتماعي، فلا شيء لإعداده هناك.
- **مهم:** `JWT_SECRET` على الخادم الجديد يختلف، لذا كل الجلسات الحالية تنتهي ويحتاج المستخدمون إعادة تسجيل الدخول مرة واحدة (بنفس كلمة المرور).

---

## 4. التخزين (Storage)

- حاوية واحدة: `media` — **خاصة (غير عامة)**.
- السكربت ينشئ الحاوية بنفس `public` و `file_size_limit` و `allowed_mime_types`، ثم يرفع الملفات بمساراتها الأصلية حرفياً، لذا تظل الروابط المخزّنة في قاعدة البيانات صحيحة.
- سياسات `storage.objects` مشمولة في `backup.sql` (قسم POLICIES يغطي مخطط `storage` أيضاً).
- لأن الحاوية خاصة، يقرأ الموقع الملفات عبر مسار الوسيط `src/routes/api/public/media/$.ts` — لا يلزم تغييره.
- على الخادم الجديد اضبط `STORAGE_BACKEND=file` (أو S3) وحجماً كافياً على القرص.

---

## 5. متغيرات البيئة المطلوبة للتطبيق

| المتغير | القيمة الجديدة |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | `https://api.your-domain.com` (رابط Kong على خادمك) |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | مفتاح `anon` المولَّد من `JWT_SECRET` الجديد |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح `service_role` الجديد — سرّي، للخادم فقط |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | أي مُعرّف نصي؛ يُستخدم للعرض فقط |
| `LOVABLE_API_KEY` / `LOVABLE_CRON_SECRET` | تُنشأ من جديد فقط إن استُخدمت؛ المشروع لا يعتمد عليهما حالياً في الواجهة |

في Supabase Self-Hosted المفاتيح هي JWT كلاسيكية (`eyJ...`) وليست `sb_publishable_`/`sb_secret_`؛
الكود يتعامل مع الحالتين تلقائياً (`createSupabaseFetch` في `src/integrations/supabase/client.ts`
و `client.server.ts`)، فلا يلزم تعديل.

---

## 6. أماكن الكود المرتبطة بـSupabase (وما يلزم تغييره)

كلها تقرأ من متغيرات البيئة — **لا يوجد أي رابط أو مفتاح مكتوب داخل منطق التطبيق**:

- `src/integrations/supabase/client.ts` — عميل المتصفح (env).
- `src/integrations/supabase/client.server.ts` — عميل الخدمة (env).
- `src/integrations/supabase/auth-middleware.ts` — تحقق الجلسة في دوال الخادم (env).
- `src/lib/content.server.ts` و `src/routes/sitemap[.]xml.ts` — قراءة عامة (env).
- `src/routes/api/public/media/$.ts` — وسيط ملفات التخزين.
- `vite.config.ts` **السطر 14–19** — القيم الاحتياطية الوحيدة المكتوبة في الكود (رابط ومفتاح anon الحاليان).
  **هذا هو التغيير الوحيد المطلوب في الكود:** استبدل القيمتين الاحتياطيتين، أو اكتفِ بضبط
  `SUPABASE_URL` و `SUPABASE_PUBLISHABLE_KEY` في بيئة البناء فتتجاوزهما.
- `.env` — حدّث القيم الست.
- `supabase/config.toml` — يحتوي `project_id` الخاص بالسحابة؛ لا أثر له على التشغيل بعد النقل.

---

## 7. ملاحظات وتحذيرات

- جدول `db_targets` (بيانات اتصال القواعد البديلة، يتضمن مفاتيح خدمة) يُنقل ضمن `backup.sql`.
  إن لم ترغب بنقل مفاتيحه، احذف صفوفه بعد الاستيراد:
  `DELETE FROM public.db_targets;`
- صفحة `/installdb` داخل الموقع تتيح أيضاً نسخ محتوى الجداول مباشرة إلى القاعدة الجديدة عبر REST
  (Upsert بلا تكرار) — مفيدة لمزامنة أي بيانات تُضاف بعد أخذ النسخة، لكنها لا تنقل المستخدمين ولا الملفات.
- ما ليس قابلاً للتصدير من السحابة أساساً: أسرار المشروع وقيمها (تُنشأ من جديد)، سجلات النظام
  (Logs/Analytics)، النسخ الاحتياطية التلقائية، وإعدادات لوحة التحكم السحابية.
- المشروع لا يستخدم Edge Functions ولا Realtime ولا pg_cron، فلا شيء إضافي لإعداده.

---

## 8. قائمة مختصرة للمطور

1. `backup-<التاريخ>.sql`
2. `storage-migrate-<التاريخ>.sh`
3. مستودع الكود (مع `supabase/migrations/`)
4. هذا الملف `MIGRATION.md`
5. بعد التثبيت: مفاتيح `anon` و `service_role` الجديدة + رابط الـAPI ← تُوضع في متغيرات البيئة وتُعاد عملية البناء.
