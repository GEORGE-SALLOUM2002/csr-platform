/** رفع محتوى علمي جديد (بحث/محاضرة/مقال) مع محرّر مقال غني يدعم إدراج الصور. */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, TextField, MenuItem, Button, Typography, Alert, Stack, CircularProgress, Divider,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { PageHeader } from "../../components/ui";
import RichEditor from "../../components/RichEditor";
import { LibraryAPI } from "../../api/services";
import { asList } from "../../hooks/useFetch";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const TYPES = ["RESEARCH", "LECTURE", "ARTICLE"];
const EMPTY = {
  title_ar: "", title_en: "",
  description_ar: "", description_en: "",
  content_ar: "", content_en: "",
  resource_type: "", category: "",
};

export default function UploadResource() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { user } = useAuth();
  const { confirm } = useConfirm();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [formKey, setFormKey] = useState(0); // لإعادة تهيئة المحرّرات بعد الإرسال

  useEffect(() => {
    LibraryAPI.categories().then((r) => setCategories(asList(r.data))).catch(() => {});
  }, []);

  const blocked = user?.role === "DOCTOR" && !user?.is_approved;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setHtml = (k) => (html) => setForm((f) => ({ ...f, [k]: html }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!(await confirm({
      message: ar("رفع هذا المحتوى وإرساله للمراجعة؟", "Upload this content and send it for review?"),
      confirmText: t("common.send"),
    }))) return;
    setSubmitting(true);
    setSuccess(false);
    setError(false);
    try {
      const fd = new FormData();
      fd.append("title_ar", form.title_ar);
      fd.append("title_en", form.title_en);
      fd.append("description_ar", form.description_ar);
      fd.append("description_en", form.description_en);
      fd.append("content_ar", form.content_ar);
      fd.append("content_en", form.content_en);
      fd.append("resource_type", form.resource_type);
      fd.append("category", form.category);
      if (file) fd.append("file", file);
      await LibraryAPI.create(fd);
      setSuccess(true);
      setForm(EMPTY);
      setFile(null);
      setFormKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("dashboard.uploadResource")} />

      {blocked ? (
        <Alert severity="warning">{t("auth.pendingApproval")}</Alert>
      ) : (
        <Card elevation={0}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2.5}>
                {success && <Alert severity="success">{t("dashboard.uploadSuccess")}</Alert>}
                {error && <Alert severity="error">{t("common.error")}</Alert>}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField label={t("dashboard.title_ar")} value={form.title_ar} onChange={set("title_ar")} required fullWidth />
                  <TextField label={t("dashboard.title_en")} value={form.title_en} onChange={set("title_en")} required fullWidth />
                </Box>

                <TextField
                  label={lang === "ar" ? "ملخّص مختصر (عربي)" : "Short summary (Arabic)"}
                  value={form.description_ar}
                  onChange={set("description_ar")}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label={lang === "ar" ? "ملخّص مختصر (إنجليزي)" : "Short summary (English)"}
                  value={form.description_en}
                  onChange={set("description_en")}
                  fullWidth
                  multiline
                  minRows={2}
                />

                <Divider textAlign={lang === "ar" ? "right" : "left"}>
                  <Typography variant="body2" color="text.secondary">
                    {lang === "ar" ? "محتوى المقال (نص + صور)" : "Article content (text + images)"}
                  </Typography>
                </Divider>

                <RichEditor
                  key={`ar-${formKey}`}
                  dir="rtl"
                  label={lang === "ar" ? "محتوى المقال (عربي)" : "Article content (Arabic)"}
                  value={form.content_ar}
                  onChange={setHtml("content_ar")}
                />
                <RichEditor
                  key={`en-${formKey}`}
                  dir="ltr"
                  label={lang === "ar" ? "محتوى المقال (إنجليزي)" : "Article content (English)"}
                  value={form.content_en}
                  onChange={setHtml("content_en")}
                />
                <Typography variant="caption" color="text.secondary">
                  {lang === "ar"
                    ? "لإضافة صورة: ضع المؤشر في المكان المطلوب ثم اضغط أيقونة الصورة 🖼️ في شريط الأدوات. تحكّم بالمحاذاة عبر أزرار المحاذاة."
                    : "To add an image: place the cursor where you want it, then click the image icon 🖼️ in the toolbar. Use the align buttons to position it."}
                </Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField select label={t("dashboard.type")} value={form.resource_type} onChange={set("resource_type")} required fullWidth>
                    {TYPES.map((tp) => (
                      <MenuItem key={tp} value={tp}>{t(`types.${tp}`)}</MenuItem>
                    ))}
                  </TextField>
                  <TextField select label={t("dashboard.category")} value={form.category} onChange={set("category")} required fullWidth>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{tr(c, "name", lang)}</MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
                    {lang === "ar" ? "ملف PDF (اختياري)" : "PDF file (optional)"}
                    <input hidden type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  </Button>
                  {file && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {file.name}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {t("common.send")}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
