/** خطّاف بسيط لجلب البيانات من الـ API مع حالات التحميل/الخطأ وإعادة التحميل. */
import { useState, useEffect, useCallback } from "react";

export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.resolve(fetcher())
      .then((res) => setData(res.data))
      // نحفظ رمز حالة HTTP (مثل 404) إن وُجد لعرض رسالة مناسبة، وإلا true
      .catch((err) => setError(err?.response?.status || true))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

/** يعيد مصفوفة النتائج سواء كانت الاستجابة مصفوفة أو صفحة (paginated). */
export function asList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}
