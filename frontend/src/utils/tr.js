/**
 * دالة اختيار الحقل المناسب للغة الحالية من كائن قادم من الـ API.
 * مثال: tr(doctor, "specialty", "ar")  →  doctor.specialty_ar
 * تعود للعربية إن كان حقل اللغة الأخرى فارغاً.
 */
export function tr(obj, field, lang) {
  if (!obj) return "";
  const val = obj[`${field}_${lang}`];
  if (val) return val;
  return obj[`${field}_ar`] || obj[`${field}_en`] || "";
}
