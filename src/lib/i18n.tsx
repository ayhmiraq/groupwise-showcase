import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "ar" | "en";

const STORAGE_KEY = "ufuq-lang";

type Dict = Record<string, { ar: string; en: string }>;

export const dict: Dict = {
  home: { ar: "الرئيسية", en: "Home" },
  services: { ar: "خدماتنا", en: "Services" },
  journey: { ar: "مسيرتنا", en: "Journey" },
  projects: { ar: "المشاريع", en: "Projects" },
  store: { ar: "المتجر", en: "Store" },
  contact: { ar: "التواصل معنا", en: "Contact" },
  companies: { ar: "شركاتنا", en: "Companies" },
  ourCompanies: { ar: "الشركات التابعة للمجموعة", en: "Companies within the group" },
  companiesIntro: {
    ar: "شركات متخصصة تعمل بتكامل تحت مظلة واحدة",
    en: "Specialised companies working together under one umbrella",
  },
  viewDetails: { ar: "عرض التفاصيل", en: "View details" },
  timeline: { ar: "التسلسل الزمني", en: "Timeline" },
  founded: { ar: "تاريخ التأسيس", en: "Founded" },
  admin: { ar: "لوحة التحكم", en: "Dashboard" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  signOut: { ar: "خروج", en: "Sign out" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  name: { ar: "الاسم", en: "Name" },
  phone: { ar: "الهاتف", en: "Phone" },
  subject: { ar: "الموضوع", en: "Subject" },
  message: { ar: "الرسالة", en: "Message" },
  send: { ar: "إرسال", en: "Send" },
  quantity: { ar: "الكمية", en: "Quantity" },
  requestQuote: { ar: "طلب استفسار", en: "Request a quote" },
  price: { ar: "السعر", en: "Price" },
  onRequest: { ar: "حسب الطلب", en: "On request" },
  inStock: { ar: "متوفر", en: "In stock" },
  outOfStock: { ar: "غير متوفر", en: "Out of stock" },
  allCategories: { ar: "كل الأقسام", en: "All categories" },
  status: { ar: "الحالة", en: "Status" },
  location: { ar: "الموقع", en: "Location" },
  planned: { ar: "مخطط", en: "Planned" },
  ongoing: { ar: "قيد التنفيذ", en: "Ongoing" },
  completed: { ar: "منجز", en: "Completed" },
  readMore: { ar: "اقرأ المزيد", en: "Read more" },
  backToStore: { ar: "رجوع إلى المتجر", en: "Back to store" },
  quickLinks: { ar: "روابط سريعة", en: "Quick links" },
  contactInfo: { ar: "معلومات التواصل", en: "Contact info" },
  rights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  sent: { ar: "تم إرسال طلبك بنجاح", en: "Your message was sent" },
  failed: { ar: "حدث خطأ، حاول مرة أخرى", en: "Something went wrong, try again" },
  noItems: { ar: "لا توجد عناصر بعد", en: "No items yet" },
  langSwitch: { ar: "English", en: "العربية" },
};

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof dict | string) => string;
  pick: (ar?: string | null, en?: string | null) => string;
  dir: "rtl" | "ltr";
};

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      dir: lang === "ar" ? "rtl" : "ltr",
      t: (key) => dict[key as string]?.[lang] ?? String(key),
      pick: (ar, en) => (lang === "ar" ? (ar ?? en ?? "") : (en ?? ar ?? "")),
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
  return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", {
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
  return `${new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(price)} ${currency}`;
}
