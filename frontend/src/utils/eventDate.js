/**
 * تواريخ الأنشطة والمؤتمرات: نشاط ليوم واحد (date) أو يمتد لعدة أيام (date → end_date).
 * تُستخدم في الروزنامة وصفحات الأنشطة وشريط الإعلانات.
 */

// حدّ أمان لعدد أيام النشاط الواحد عند توزيعه على الروزنامة
const MAX_SPAN_DAYS = 366;

/** مفتاح اليوم من كائن Date بالتوقيت المحلي (لا نستخدم toISOString لأنها تحوّل إلى UTC). */
export function keyOfDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** مفتاح اليوم بصيغة YYYY-MM-DD من قيمة الـ API، دون انزياح المنطقة الزمنية. */
export function dayKey(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  return isNaN(d) ? null : keyOfDate(d);
}

/** كائن Date من مفتاح يوم (منتصف الليل بالتوقيت المحلي). */
function fromKey(key) {
  return key ? new Date(`${key}T00:00:00`) : null;
}

/**
 * كل أيام النشاط كمفاتيح YYYY-MM-DD.
 * يوم واحد → [البداية]. عدة أيام → كل يوم من البداية حتى الانتهاء.
 */
export function eventDays(activity) {
  const startKey = dayKey(activity?.date);
  if (!startKey) return [];
  const endKey = dayKey(activity?.end_date);
  if (!endKey || endKey <= startKey) return [startKey];

  const days = [];
  const cur = fromKey(startKey);
  const end = fromKey(endKey);
  while (cur <= end && days.length < MAX_SPAN_DAYS) {
    days.push(keyOfDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/** هل النشاط ممتدّ على أكثر من يوم؟ */
export function isMultiDay(activity) {
  const s = dayKey(activity?.date);
  const e = dayKey(activity?.end_date);
  return !!(s && e && e > s);
}

/**
 * نص التاريخ المعروض: «20/11/2026» ليوم واحد، أو «20/11/2026 – 23/11/2026» لعدة أيام.
 */
export function eventDateLabel(activity, lang = "ar") {
  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const start = fromKey(dayKey(activity?.date));
  if (!start) return "";
  if (!isMultiDay(activity)) return start.toLocaleDateString(locale);

  const end = fromKey(dayKey(activity.end_date));
  const fmt = new Intl.DateTimeFormat(locale);
  // formatRange يختصر الجزء المشترك (الشهر/السنة) تلقائياً حسب اللغة
  if (typeof fmt.formatRange === "function") return fmt.formatRange(start, end);
  return `${start.toLocaleDateString(locale)} – ${end.toLocaleDateString(locale)}`;
}

/** عدد أيام النشاط (1 ليوم واحد). */
export function eventDayCount(activity) {
  return eventDays(activity).length || 1;
}

/** نص مدّة النشاط: «يومان»، «٤ أيام»، «١٢ يوماً» — أو "4 days" بالإنجليزية. */
export function dayCountLabel(activity, lang = "ar") {
  const n = eventDayCount(activity);
  if (lang !== "ar") return `${n} ${n === 1 ? "day" : "days"}`;
  const num = n.toLocaleString("ar-EG");
  if (n === 1) return "يوم واحد";
  if (n === 2) return "يومان";
  if (n <= 10) return `${num} أيام`;
  return `${num} يوماً`;
}
