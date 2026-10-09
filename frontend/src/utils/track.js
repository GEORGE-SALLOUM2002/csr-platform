/**
 * عدّادات الإحصاء: زيارة الموقع (مرة لكل جلسة متصفح)، ومشاهدة الفيديو/الضغط على رابطه
 * (مرة لكل مورد في الجلسة) — لتفادي احتساب إعادة التحميل كزيارات/مشاهدات جديدة.
 */
import client from "../api/client";

function once(key) {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    /* التخزين غير متاح (وضع خاص...) — نحتسب على أي حال */
  }
  return true;
}

export function trackVisit() {
  if (once("csr-visit")) client.post("/stats/visit/").catch(() => {});
}

/** event: "view" | "click". تعيد true إن أُرسل الاحتساب فعلاً (لأول مرة في الجلسة). */
export function trackResource(id, event) {
  if (!id || !once(`csr-${event}-${id}`)) return false;
  client.post(`/resources/${id}/track/`, { event }).catch(() => {});
  return true;
}
