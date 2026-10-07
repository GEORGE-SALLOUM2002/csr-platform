/**
 * يتحقّق إن كان الملف المرفق ما زال موجوداً على الخادم (طلب HEAD خفيف).
 * يعيد: null أثناء الفحص، true إن كان موجوداً (أو تعذّر التأكّد)، false إن كان محذوفاً (404/410).
 * الهدف: عرض رسالة واضحة بدل صفحة خطأ عند الضغط على ملف محذوف.
 */
import { useEffect, useState } from "react";

export function useFileExists(url) {
  const [exists, setExists] = useState(url ? null : false);

  useEffect(() => {
    if (!url) {
      setExists(false);
      return;
    }
    let alive = true;
    setExists(null);
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((res) => alive && setExists(!(res.status === 404 || res.status === 410)))
      // خطأ شبكة/CORS (مثلاً أثناء التطوير المحلّي): لا نمنع المستخدم من فتح الملف
      .catch(() => alive && setExists(true));
    return () => {
      alive = false;
    };
  }, [url]);

  return exists;
}
