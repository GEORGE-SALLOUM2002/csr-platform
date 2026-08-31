/**
 * محرّر نص غني (Quill) يتيح تنسيق المقال وإدراج الصور في أي مكان داخل النص
 * والتحكم بمحاذاتها (يمين/وسط/يسار) واتجاه الفقرة. الصور تُضمَّن داخل المحتوى.
 * يضبط حجم الصور المدرجة (حد أقصى قابل للتهيئة) لمنع تضخّم المحتوى.
 */
import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { Box, Typography, Alert } from "@mui/material";

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  [{ direction: "rtl" }],
  ["link", "image"],
  ["clean"],
];

export default function RichEditor({ value = "", onChange, label, dir = "rtl", maxImageMB = 2 }) {
  const hostRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const dirRef = useRef(dir);
  dirRef.current = dir;
  const maxRef = useRef(maxImageMB);
  maxRef.current = maxImageMB;

  const [imgError, setImgError] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    const editorEl = document.createElement("div");
    host.appendChild(editorEl);

    const q = new Quill(editorEl, { theme: "snow", modules: { toolbar: TOOLBAR } });
    quillRef.current = q;

    // معالج مخصّص لإدراج الصور: يتحقّق من النوع والحجم قبل التضمين
    const toolbar = q.getModule("toolbar");
    toolbar.addHandler("image", () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const isAr = dirRef.current === "rtl";
        if (!file.type.startsWith("image/")) {
          setImgError(isAr ? "يُسمح بإدراج الصور فقط." : "Images only.");
          return;
        }
        if (file.size > maxRef.current * 1024 * 1024) {
          setImgError(isAr
            ? `حجم الصورة يتجاوز الحد الأقصى (${maxRef.current} ميغابايت). اختر صورة أصغر.`
            : `Image exceeds the ${maxRef.current} MB limit. Choose a smaller image.`);
          return;
        }
        setImgError("");
        const reader = new FileReader();
        reader.onload = () => {
          const range = q.getSelection(true);
          q.insertEmbed(range.index, "image", reader.result, "user");
          q.setSelection(range.index + 1, 0);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

    if (value) q.clipboard.dangerouslyPasteHTML(value);

    q.on("text-change", () => {
      const html = q.root.innerHTML;
      onChangeRef.current(html === "<p><br></p>" ? "" : html);
    });

    return () => {
      quillRef.current = null;
      host.innerHTML = ""; // إزالة المحرّر وشريط الأدوات بالكامل عند إلغاء التركيب
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // مزامنة اتجاه الكتابة مع لغة الواجهة
  useEffect(() => {
    const q = quillRef.current;
    if (q) {
      q.root.setAttribute("dir", dir);
      q.root.style.textAlign = dir === "rtl" ? "right" : "left";
    }
  }, [dir]);

  return (
    <Box>
      {label && (
        <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
          {label}
        </Typography>
      )}
      <Box
        sx={{
          "& .ql-toolbar": { borderColor: "divider", borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: "action.hover" },
          "& .ql-container": { borderColor: "divider", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, fontFamily: "inherit", fontSize: "1rem", minHeight: 200 },
          "& .ql-editor": { minHeight: 200 },
          "& .ql-editor img": { maxWidth: "100%", height: "auto", borderRadius: 8, display: "block" },
        }}
      >
        <div ref={hostRef} />
      </Box>
      {imgError && (
        <Alert severity="warning" sx={{ mt: 1 }} onClose={() => setImgError("")}>
          {imgError}
        </Alert>
      )}
    </Box>
  );
}
