/**
 * إعداد الترجمة (react-i18next).
 * نصوص الواجهة (الأزرار/القوائم) هنا. أما محتوى قاعدة البيانات فثنائي اللغة
 * عبر الحقول _ar / _en ويُختار بدالة tr() في src/utils/tr.js
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";

const saved = localStorage.getItem("csr-lang") || "ar";

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: saved,
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export default i18n;
