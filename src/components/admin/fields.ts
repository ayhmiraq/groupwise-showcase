export type FieldType = "text" | "textarea" | "number" | "date" | "boolean" | "select" | "media";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  optionsFrom?: "companies" | "store_categories" | "products";
  required?: boolean;
  hidden?: boolean;
};

export type SectionConfig = {
  key: string;
  label: string;
  table:
    | "site_settings"
    | "page_settings"
    | "companies"
    | "company_timeline"
    | "services"
    | "journey_events"
    | "projects"
    | "store_categories"
    | "products"
    | "product_images"
    | "inquiries"
    | "contact_messages";
  keyColumn: string;
  titleField: string;
  fields: Field[];
  singleRow?: boolean;
  readOnly?: boolean;
};

const bilingual = (base: string, label: string, type: FieldType = "text"): Field[] => [
  { name: `${base}_ar`, label: `${label} (عربي)`, type },
  { name: `${base}_en`, label: `${label} (English)`, type },
];

export const sections: SectionConfig[] = [
  {
    key: "settings",
    label: "إعدادات الموقع",
    table: "site_settings",
    keyColumn: "id",
    titleField: "group_name_ar",
    singleRow: true,
    fields: [
      { name: "group_name_ar", label: "اسم المجموعة (عربي)", type: "text", required: true },
      { name: "group_name_en", label: "اسم المجموعة (English)", type: "text", required: true },
      { name: "logo_url", label: "الشعار", type: "media" },
      ...bilingual("topbar_text", "نص الشريط العلوي"),
      { name: "phone", label: "الهاتف", type: "text" },
      { name: "email", label: "البريد الإلكتروني", type: "text" },
      ...bilingual("address", "العنوان"),
      { name: "whatsapp", label: "واتساب", type: "text" },
      { name: "facebook", label: "فيسبوك", type: "text" },
      { name: "instagram", label: "إنستغرام", type: "text" },
      { name: "linkedin", label: "لينكدإن", type: "text" },
      { name: "youtube", label: "يوتيوب", type: "text" },
      ...bilingual("footer_note", "نص التذييل", "textarea"),
    ],
  },
  {
    key: "pages",
    label: "خلفيات وتصميم الصفحات",
    table: "page_settings",
    keyColumn: "page_key",
    titleField: "page_key",
    fields: [
      { name: "page_key", label: "الصفحة", type: "text", required: true },
      ...bilingual("title", "العنوان"),
      ...bilingual("subtitle", "العنوان الفرعي", "textarea"),
      {
        name: "bg_type",
        label: "نوع الخلفية",
        type: "select",
        options: [
          { value: "color", label: "لون" },
          { value: "image", label: "صورة" },
          { value: "video", label: "فيديو مرفوع" },
          { value: "youtube", label: "فيديو يوتيوب" },
          { value: "aether", label: "تأثير Aether — مسح الحقل العميق" },
        ],
      },
      { name: "bg_url", label: "رابط الصورة/الفيديو", type: "media" },
      { name: "youtube_id", label: "معرّف فيديو يوتيوب", type: "text" },
      { name: "overlay", label: "شفافية الطبقة (0-95)", type: "number" },
      {
        name: "tile_bg_type",
        label: "خلفية المستطيل في الواجهة (الخدمات/المشاريع/مسيرتنا)",
        type: "select",
        options: [
          { value: "none", label: "بدون (استخدام خلفية الصفحة)" },
          { value: "image", label: "صورة" },
          { value: "video", label: "فيديو مرفوع" },
          { value: "youtube", label: "فيديو يوتيوب" },
        ],
      },
      { name: "tile_bg_url", label: "صورة/فيديو خلفية المستطيل", type: "media" },
      { name: "tile_youtube_id", label: "معرّف يوتيوب لخلفية المستطيل", type: "text" },
      { name: "tile_overlay", label: "شفافية طبقة المستطيل (0-95)", type: "number" },
      { name: "enabled", label: "مفعّل", type: "boolean" },
      { name: "fx_enabled", label: "تشغيل تأثير Aether فوق الخلفية", type: "boolean" },
      { name: "fx_density", label: "كثافة النجوم (20-600)", type: "number" },
      { name: "fx_speed", label: "سرعة الحركة (0-100)", type: "number" },
      { name: "fx_hue", label: "درجة اللون (0-360)", type: "number" },
      { name: "fx_glow", label: "قوة التوهج (0-100)", type: "number" },
      { name: "fx_grid", label: "شبكة وحلقات المسح", type: "boolean" },
      { name: "fx_scan", label: "خط المسح المتحرك", type: "boolean" },
    ],
  },
  {
    key: "companies",
    label: "الشركات",
    table: "companies",
    keyColumn: "id",
    titleField: "name_ar",
    fields: [
      { name: "slug", label: "المعرّف (slug)", type: "text", required: true },
      ...bilingual("name", "الاسم"),
      ...bilingual("tagline", "الوصف المختصر"),
      ...bilingual("description", "التفاصيل", "textarea"),
      { name: "image_url", label: "الصورة", type: "media" },
      { name: "founded_date", label: "تاريخ التأسيس", type: "date" },
      {
        name: "link_type",
        label: "نوع الرابط",
        type: "select",
        options: [
          { value: "internal", label: "صفحة داخل الموقع" },
          { value: "external", label: "رابط خارجي" },
        ],
      },
      { name: "link_url", label: "الرابط (داخلي مثل /services أو خارجي https://)", type: "text" },
      {
        name: "tile_bg_type",
        label: "خلفية مستطيل الشركة في الواجهة",
        type: "select",
        options: [
          { value: "none", label: "بدون (استخدام صورة الشركة)" },
          { value: "image", label: "صورة (تدعم GIF/WebP المتحركة)" },
          { value: "video", label: "فيديو مرفوع أو رابط مباشر" },
          { value: "youtube", label: "فيديو يوتيوب" },
        ],
      },
      { name: "tile_bg_url", label: "صورة/فيديو خلفية المستطيل", type: "media" },
      { name: "tile_youtube_id", label: "معرّف يوتيوب لخلفية المستطيل", type: "text" },
      { name: "tile_overlay", label: "شفافية طبقة المستطيل (0-95)", type: "number" },
      { name: "sort_order", label: "الترتيب", type: "number" },

      {
        name: "page_bg_type",
        label: "خلفية الصفحة الداخلية للشركة",
        type: "select",
        options: [
          { value: "color", label: "لون" },
          { value: "image", label: "صورة" },
          { value: "video", label: "فيديو مرفوع" },
          { value: "youtube", label: "فيديو يوتيوب" },
        ],
      },
      { name: "page_bg_url", label: "صورة/فيديو خلفية الصفحة", type: "media" },
      { name: "page_youtube_id", label: "معرّف يوتيوب لخلفية الصفحة", type: "text" },
      { name: "page_overlay", label: "شفافية طبقة الصفحة (0-95)", type: "number" },
      ...bilingual("page_title", "عنوان الصفحة الداخلية"),
      ...bilingual("page_subtitle", "العنوان الفرعي للصفحة", "textarea"),
      ...bilingual("page_content", "نصوص وتفاصيل الصفحة", "textarea"),
      ...bilingual("timeline_title", "عنوان قسم التسلسل الزمني"),
      { name: "opening_date", label: "تاريخ الافتتاح", type: "date" },

      { name: "published", label: "منشور", type: "boolean" },

  },
  {
    key: "timeline",
    label: "التسلسل الزمني للشركات",
    table: "company_timeline",
    keyColumn: "id",
    titleField: "title_ar",
    fields: [
      { name: "company_id", label: "الشركة", type: "select", optionsFrom: "companies", required: true },
      { name: "event_date", label: "التاريخ", type: "date", required: true },
      ...bilingual("title", "العنوان"),
      ...bilingual("description", "التفاصيل", "textarea"),
      { name: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    key: "services",
    label: "الخدمات",
    table: "services",
    keyColumn: "id",
    titleField: "title_ar",
    fields: [
      ...bilingual("title", "العنوان"),
      ...bilingual("description", "التفاصيل", "textarea"),
      { name: "image_url", label: "الصورة", type: "media" },
      { name: "sort_order", label: "الترتيب", type: "number" },
      { name: "published", label: "منشور", type: "boolean" },
    ],
  },
  {
    key: "journey",
    label: "مسيرتنا",
    table: "journey_events",
    keyColumn: "id",
    titleField: "title_ar",
    fields: [
      { name: "event_date", label: "التاريخ", type: "date", required: true },
      ...bilingual("title", "العنوان"),
      ...bilingual("description", "التفاصيل", "textarea"),
      { name: "image_url", label: "الصورة", type: "media" },
      { name: "sort_order", label: "الترتيب", type: "number" },
      { name: "published", label: "منشور", type: "boolean" },
    ],
  },
  {
    key: "projects",
    label: "المشاريع",
    table: "projects",
    keyColumn: "id",
    titleField: "title_ar",
    fields: [
      { name: "slug", label: "المعرّف (slug)", type: "text", required: true },
      ...bilingual("title", "العنوان"),
      ...bilingual("description", "التفاصيل", "textarea"),
      ...bilingual("location", "الموقع"),
      { name: "image_url", label: "الصورة", type: "media" },
      {
        name: "status",
        label: "الحالة",
        type: "select",
        options: [
          { value: "completed", label: "منجز" },
          { value: "ongoing", label: "قيد التنفيذ" },
          { value: "planned", label: "مخطط" },
        ],
      },
      { name: "company_id", label: "الشركة المنفذة", type: "select", optionsFrom: "companies" },
      { name: "start_date", label: "تاريخ البدء", type: "date" },
      { name: "end_date", label: "تاريخ الانتهاء", type: "date" },
      { name: "sort_order", label: "الترتيب", type: "number" },
      { name: "published", label: "منشور", type: "boolean" },
    ],
  },
  {
    key: "categories",
    label: "أقسام المتجر",
    table: "store_categories",
    keyColumn: "id",
    titleField: "name_ar",
    fields: [
      { name: "slug", label: "المعرّف (slug)", type: "text", required: true },
      ...bilingual("name", "الاسم"),
      { name: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    key: "products",
    label: "منتجات المتجر",
    table: "products",
    keyColumn: "id",
    titleField: "name_ar",
    fields: [
      { name: "slug", label: "المعرّف (slug)", type: "text", required: true },
      { name: "category_id", label: "القسم", type: "select", optionsFrom: "store_categories" },
      ...bilingual("name", "الاسم"),
      ...bilingual("description", "التفاصيل", "textarea"),
      { name: "price", label: "السعر", type: "number" },
      { name: "currency", label: "العملة", type: "text" },
      { name: "image_url", label: "الصورة الرئيسية", type: "media" },
      { name: "in_stock", label: "متوفر", type: "boolean" },
      { name: "featured", label: "مميز", type: "boolean" },
      { name: "sort_order", label: "الترتيب", type: "number" },
      { name: "published", label: "منشور", type: "boolean" },
    ],
  },
  {
    key: "product_images",
    label: "صور إضافية للمنتجات",
    table: "product_images",
    keyColumn: "id",
    titleField: "image_url",
    fields: [
      { name: "product_id", label: "المنتج", type: "select", optionsFrom: "products", required: true },
      { name: "image_url", label: "الصورة", type: "media", required: true },
      { name: "sort_order", label: "الترتيب", type: "number" },
    ],
  },
  {
    key: "inquiries",
    label: "طلبات الاستفسار",
    table: "inquiries",
    keyColumn: "id",
    titleField: "name",
    readOnly: true,
    fields: [
      { name: "name", label: "الاسم", type: "text" },
      { name: "phone", label: "الهاتف", type: "text" },
      { name: "email", label: "البريد", type: "text" },
      { name: "quantity", label: "الكمية", type: "number" },
      { name: "message", label: "الرسالة", type: "textarea" },
      {
        name: "status",
        label: "الحالة",
        type: "select",
        options: [
          { value: "new", label: "جديد" },
          { value: "in_progress", label: "قيد المعالجة" },
          { value: "closed", label: "مغلق" },
        ],
      },
    ],
  },
  {
    key: "messages",
    label: "رسائل التواصل",
    table: "contact_messages",
    keyColumn: "id",
    titleField: "name",
    readOnly: true,
    fields: [
      { name: "name", label: "الاسم", type: "text" },
      { name: "phone", label: "الهاتف", type: "text" },
      { name: "email", label: "البريد", type: "text" },
      { name: "subject", label: "الموضوع", type: "text" },
      { name: "message", label: "الرسالة", type: "textarea" },
      {
        name: "status",
        label: "الحالة",
        type: "select",
        options: [
          { value: "new", label: "جديد" },
          { value: "read", label: "مقروء" },
          { value: "closed", label: "مغلق" },
        ],
      },
    ],
  },
];
