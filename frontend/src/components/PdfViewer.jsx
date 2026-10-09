/**
 * عارض PDF داخل الصفحة بلا زر تحميل أو طباعة (منع التحميل).
 * يرسم الصفحات كصور (canvas) عبر PDF.js بدل عارض المتصفح المدمج الذي يتيح الحفظ.
 * الصفحات تُرسَم عند اقترابها من الشاشة فقط لتخفيف الحِمل في الملفات الكبيرة.
 */
import { useEffect, useRef, useState } from "react";
import { Box, Alert, CircularProgress, Typography, Stack } from "@mui/material";

// تحميل PDF.js عند الحاجة فقط (لا يُثقل الحزمة الرئيسية)
let pdfjsPromise = null;
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((lib) => {
      // Vite يحزم العامل كملف .js (لا .mjs) فيُخدَم بنوع MIME صحيح على أي خادم
      lib.GlobalWorkerOptions.workerPort = new Worker(
        new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
        { type: "module" }
      );
      return lib;
    });
  }
  return pdfjsPromise;
}

const block = (e) => e.preventDefault();

function PdfPage({ pdf, number, width }) {
  const holder = useRef(null);
  const canvas = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(1.414); // نسبة A4 إلى أن تُعرف الأبعاد الحقيقية

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !width) return;
    let task = null;
    let cancelled = false;
    pdf.getPage(number).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setRatio(base.height / base.width);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      const c = canvas.current;
      c.width = viewport.width;
      c.height = viewport.height;
      task = page.render({ canvasContext: c.getContext("2d"), viewport });
      task.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [visible, width, pdf, number]);

  return (
    <Box
      ref={holder}
      sx={{ width: "100%", aspectRatio: `1 / ${ratio}`, bgcolor: "#fff", boxShadow: 1, borderRadius: 1, overflow: "hidden" }}
    >
      {/* dir="ltr": اتجاه الصفحة العربية (RTL) يُفسد رسم نصوص PDF على اللوحة */}
      <canvas ref={canvas} dir="ltr" style={{ width: "100%", height: "100%", display: "block" }} />
    </Box>
  );
}

export default function PdfViewer({ src, lang }) {
  const ar = (a, e) => (lang === "ar" ? a : e);
  const wrap = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [error, setError] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let doc = null;
    let alive = true;
    setPdf(null);
    setError(false);
    loadPdfjs()
      .then((lib) => lib.getDocument({ url: src, disableAutoFetch: true }).promise)
      .then((d) => { doc = d; if (alive) setPdf(d); else d.destroy(); })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
      doc?.destroy();
    };
  }, [src]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <Box
      ref={wrap}
      onContextMenu={block}
      onDragStart={block}
      sx={{
        userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
        bgcolor: "action.hover", borderRadius: 2, p: { xs: 1, sm: 2 },
        maxHeight: { xs: 560, md: 760 }, overflowY: "auto",
        // منع الطباعة (Ctrl+P) من إخراج صفحات الملف
        "@media print": { display: "none" },
      }}
    >
      {error ? (
        <Alert severity="warning">
          {ar("تعذّر عرض الملف. أعد تحميل الصفحة.", "Could not display the file. Please reload the page.")}
        </Alert>
      ) : !pdf ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Stack spacing={2}>
          <Typography variant="caption" color="text.secondary">
            {ar(`${pdf.numPages} صفحة — للعرض داخل الموقع فقط`, `${pdf.numPages} pages — view only`)}
          </Typography>
          {Array.from({ length: pdf.numPages }, (_, i) => (
            <PdfPage key={i} pdf={pdf} number={i + 1} width={width ? width - 2 : 0} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
