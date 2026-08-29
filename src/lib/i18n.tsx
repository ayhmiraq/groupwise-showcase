import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "ar" | "en" | "fa" | "ku" | "tk";

const STORAGE_KEY = "ufuq-lang";

export const languages: { code: Lang; label: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "ku", label: "کوردی", dir: "rtl" },
  { code: "tk", label: "تۆرکمن", dir: "rtl" },
];

type Entry = Record<Lang, string>;
type Dict = Record<string, Entry>;

const e = (ar: string, en: string, fa: string, ku: string, tk: string): Entry => ({
  ar,
  en,
  fa,
  ku,
  tk,
});

export const dict: Dict = {
  home: e("الرئيسية", "Home", "خانه", "سەرەکی", "باش صحیفه"),
  services: e("خدماتنا", "Services", "خدمات ما", "خزمەتگوزارییەکان", "خیدماتلارېمېز"),
  journey: e("مسيرتنا", "Journey", "مسیر ما", "ڕێڕەوی ئێمە", "یولومېز"),
  projects: e("المشاريع", "Projects", "پروژه‌ها", "پڕۆژەکان", "پروژه‌لر"),
  store: e("المتجر", "Store", "فروشگاه", "فرۆشگا", "دۆکان"),
  contact: e("التواصل معنا", "Contact", "تماس با ما", "پەیوەندی", "بیزه یازېن"),
  companies: e("شركاتنا", "Companies", "شرکت‌های ما", "کۆمپانیاکانمان", "شیرکتلرېمېز"),
  ourCompanies: e(
    "الشركات التابعة للمجموعة",
    "Companies within the group",
    "شرکت‌های زیرمجموعه",
    "کۆمپانیاکانی گرووپ",
    "گروپا باغلې شیرکتلر",
  ),
  companiesIntro: e(
    "شركات متخصصة تعمل بتكامل تحت مظلة واحدة",
    "Specialised companies working together under one umbrella",
    "شرکت‌های تخصصی که زیر یک چتر کار می‌کنند",
    "کۆمپانیای پسپۆر لە ژێر یەک چەتردا",
    "بیر چاتېر آستېندا ایشلیان شیرکتلر",
  ),
  viewDetails: e("عرض التفاصيل", "View details", "مشاهده جزئیات", "بینینی وردەکاری", "تفصیلاتې گؤر"),
  timeline: e("التسلسل الزمني", "Timeline", "خط زمانی", "هێڵی کات", "زمان سېراسې"),
  founded: e("تاريخ التأسيس", "Founded", "تاریخ تأسیس", "ساڵی دامەزراندن", "قورولوش تاریخې"),
  admin: e("لوحة التحكم", "Dashboard", "پنل مدیریت", "پانێڵی بەڕێوەبردن", "ایداره پانېلې"),
  signIn: e("تسجيل الدخول", "Sign in", "ورود", "چوونەژوورەوە", "گیریش"),
  signOut: e("خروج", "Sign out", "خروج", "چوونەدەرەوە", "چېقېش"),
  email: e("البريد الإلكتروني", "Email", "ایمیل", "ئیمەیل", "ایمیل"),
  password: e("كلمة المرور", "Password", "گذرواژه", "وشەی نهێنی", "پارول"),
  name: e("الاسم", "Name", "نام", "ناو", "آد"),
  phone: e("الهاتف", "Phone", "تلفن", "تەلەفۆن", "تلفون"),
  subject: e("الموضوع", "Subject", "موضوع", "بابەت", "موضوع"),
  message: e("الرسالة", "Message", "پیام", "پەیام", "مکتوب"),
  send: e("إرسال", "Send", "ارسال", "ناردن", "گؤندر"),
  quantity: e("الكمية", "Quantity", "تعداد", "بڕ", "مقدار"),
  requestQuote: e("طلب استفسار", "Request a quote", "درخواست استعلام", "داواکاری نرخ", "صورشتېرما"),
  price: e("السعر", "Price", "قیمت", "نرخ", "باها"),
  onRequest: e("حسب الطلب", "On request", "بر اساس درخواست", "بەپێی داواکاری", "طلبه گؤره"),
  inStock: e("متوفر", "In stock", "موجود", "بەردەستە", "وار"),
  outOfStock: e("غير متوفر", "Out of stock", "ناموجود", "بەردەست نییە", "یۆق"),
  allCategories: e("كل الأقسام", "All categories", "همه دسته‌ها", "هەموو بەشەکان", "بۆتون بؤلوملر"),
  status: e("الحالة", "Status", "وضعیت", "دۆخ", "حالت"),
  location: e("الموقع", "Location", "موقعیت", "شوێن", "یر"),
  planned: e("مخطط", "Planned", "برنامه‌ریزی‌شده", "پلاندارێژراو", "پلانلې"),
  ongoing: e("قيد التنفيذ", "Ongoing", "در حال اجرا", "لە بەردەوامدا", "داوام ادیار"),
  completed: e("منجز", "Completed", "تکمیل‌شده", "تەواوکراو", "تماملانان"),
  readMore: e("اقرأ المزيد", "Read more", "بیشتر بخوانید", "زیاتر بخوێنە", "داها آرتېق"),
  backToStore: e("رجوع إلى المتجر", "Back to store", "بازگشت به فروشگاه", "گەڕانەوە بۆ فرۆشگا", "دۆکانا دؤن"),
  quickLinks: e("روابط سريعة", "Quick links", "لینک‌های سریع", "بەستەری خێرا", "تیز لینکلر"),
  contactInfo: e("معلومات التواصل", "Contact info", "اطلاعات تماس", "زانیاری پەیوەندی", "علاقه معلوماتې"),
  rights: e("جميع الحقوق محفوظة", "All rights reserved", "تمام حقوق محفوظ است", "هەموو مافەکان پارێزراون", "بۆتون حقلر محفوظ"),
  sent: e("تم إرسال طلبك بنجاح", "Your message was sent", "پیام شما ارسال شد", "پەیامەکەت نێردرا", "مکتوبېن گؤندریلدې"),
  failed: e("حدث خطأ، حاول مرة أخرى", "Something went wrong, try again", "خطایی رخ داد، دوباره تلاش کنید", "هەڵەیەک ڕوویدا، دووبارە هەوڵبدە", "خطا اۆلدې، تکرار سېنا"),
  noItems: e("لا توجد عناصر بعد", "No items yet", "موردی موجود نیست", "هێشتا هیچ شت نییە", "هنوز عنصر یۆق"),
  language: e("اللغة", "Language", "زبان", "زمان", "دیل"),
};

const localeMap: Record<Lang, string> = {
  ar: "ar-EG",
  en: "en-GB",
  fa: "fa-IR",
  ku: "ar-IQ",
  tk: "ar-IQ",
};

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof dict | string) => string;
  pick: (ar?: string | null, en?: string | null) => string;
  dir: "rtl" | "ltr";
};

const LangContext = createContext<LangContextValue | null>(null);

function dirOf(lang: Lang): "rtl" | "ltr" {
  return languages.find((item) => item.code === lang)?.dir ?? "rtl";
}

function isLang(value: string | null): value is Lang {
  return languages.some((item) => item.code === value);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dirOf(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      dir: dirOf(lang),
      t: (key) => dict[key as string]?.[lang] ?? dict[key as string]?.ar ?? String(key),
      // Content is stored bilingually; non-Arabic/English UI languages fall back
      // to Arabic content because it is the closest script for fa/ku/tk readers.
      pick: (ar, en) => (lang === "en" ? (en ?? ar ?? "") : (ar ?? en ?? "")),
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

export function formatDate(value?: string | null, lang: Lang = "ar") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(localeMap[lang], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPrice(
  price: number | null | undefined,
  currency: string,
  lang: Lang,
  fallback: string,
) {
  if (price == null) return fallback;
  return `${new Intl.NumberFormat(lang === "en" ? "en-US" : localeMap[lang]).format(price)} ${currency}`;
}
