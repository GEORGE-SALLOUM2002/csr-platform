/** رفع محتوى علمي جديد (بحث/محاضرة/مقال) مع محرّر مقال غني يدعم إدراج الصور. */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, TextField, MenuItem, Button, Typography, Alert, Stack, CircularProgress, Divider,
  LinearProgress,
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
import { ALLOWED_EXTS, ACCEPT_ATTR, MAX_FILE_MB, fileExt, fileKindInfo } from "../../utils/fileKind";
import { normalizeVideoInput, parseVideoLink } from "../../utils/videoLink";

const TYPES = ["RESEARCH", "LECTURE", "ARTICLE"];
const EMPTY = {
  title_ar: "", title_en: "",
  description_ar: "", description_en: "",
  content_ar: "", content_en: "",
  resource_type: "", category: "",
  video_url: "",
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
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState(0);
  const [formKey, setFormKey] = useState(0); // لإعادة تهيئة المحرّرات بعد الإرسال

  useEffect(() => {
    LibraryAPI.categories().then((r) => setCategories(asList(r.data))).catch(() => {});
  }, []);

  const blocked = user?.role === "DOCTOR" && !user?.is_approved;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setHtml = (k) => (html) => setForm((f) => ({ ...f, [k]: html }));

  // التحقق من نوع وحجم الملف المرفق قبل الرفع (نفس قواعد الخلفية)
  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    e.target.value = ""; // للسماح بإعادة اختيار الملف نفسه
    setFileError("");
    if (!f) return;
    if (!ALLOWED_EXTS.includes(fileExt(f.name))) {
      setFile(null);
      setFileError(ar(
        `نوع الملف «${f.name}» غير مسموح. المسموح: ${ALLOWED_EXTS.join("، ").toUpperCase()}.`,
        `File "${f.name}" type not allowed. Allowed: ${ALLOWED_EXTS.join(", ").toUpperCase()}.`
      ));
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      setFileError(ar(
        `حجم الملف يتجاوز الحد الأقصى (${MAX_FILE_MB} ميغابايت).`,
        `File exceeds the maximum size (${MAX_FILE_MB} MB).`
      ));
      return;
    }
    setFile(f);
  };

  // رابط الفيديو: يقبل رابطاً أو كود تضمين (iframe) من YouTube أو Microsoft
  const videoUrl = normalizeVideoInput(form.video_url);
  const videoLink = videoUrl ? parseVideoLink(videoUrl) : null;
  const videoInvalid = !!videoUrl && !videoLink?.provider;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (videoInvalid) return;
    if (!(await confirm({
      message: ar("رفع هذا المحتوى وإرساله للمراجعة؟", "Upload this content and send it for review?"),
      confirmText: t("common.send"),
    }))) return;
    setSubmitting(true);
    setSuccess(false);
    setError(false);
    setProgress(0);
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
      fd.append("video_url", videoUrl);
      if (file) fd.append("file", file);
      await LibraryAPI.create(fd, {
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded * 100) / ev.total)),
      });
      setSuccess(true);
      setForm(EMPTY);
      setFile(null);
      setFormKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // عرض رسالة الخلفية إن وُجدت (مثل رفض نوع/حجم الملف)، وإلا رسالة عامة
      const d = err?.response?.data;
      const status = err?.response?.status;
      let msg = "";
      if (status === 413) {
        msg = ar("حجم الملف أكبر من المسموح به على الخادم.", "The file is larger than the server allows.");
      } else if (d && typeof d === "object") {
        const first = Object.values(d).flat().find((v) => typeof v === "string");
        if (first) msg = first;
      }
      setError(msg || true);
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
                {error && <Alert severity="error">{typeof error === "string" ? error : t("common.error")}</Alert>}

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
                  <TextField
                    label={ar("رابط فيديو (YouTube أو Microsoft OneDrive/SharePoint)", "Video link (YouTube or Microsoft OneDrive/SharePoint)")}
                    value={form.video_url}
                    onChange={set("video_url")}
                    fullWidth
                    placeholder="https://www.youtube.com/watch?v=…"
                    error={videoInvalid}
                    helperText={
                      videoInvalid
                        ? ar("الرابط غير مدعوم — يُقبل YouTube أو Microsoft OneDrive/SharePoint فقط.", "Unsupported link — only YouTube or Microsoft OneDrive/SharePoint.")
                        : videoLink?.provider === "microsoft" && !videoLink.embedUrl
                          ? ar("سيظهر كزر يفتح الفيديو في نافذة جديدة. لعرضه داخل الموقع: من صفحة الفيديو في Stream اختر «مشاركة ← تضمين» والصق كود التضمين هنا.",
                               "Will show as a button opening the video in a new tab. To play it inside the site: in Stream choose Share → Embed and paste the embed code here.")
                          : videoLink?.embedUrl
                            ? ar("✓ سيُعرض الفيديو داخل الموقع مباشرة.", "✓ The video will play inside the site.")
                            : ar("اختياري — الصق رابط الفيديو أو كود التضمين.", "Optional — paste the video link or embed code.")
                    }
                  />
                </Box>

                <Box>
                  <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />} disabled={submitting}>
                    {ar("رفع ملفات مرفقة", "Upload attachments")}
                    <input hidden type="file" accept={ACCEPT_ATTR} onChange={onPickFile} />
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                    {ar(
                      `اختياري — ملف واحد: PDF، فيديو MP4، صوت MP3/WAV (حتى ${MAX_FILE_MB} ميغابايت). يُعرض داخل الموقع فقط ولا يمكن تحميله؛ حوّل ملفات Word/PowerPoint إلى PDF قبل رفعها.`,
                      `Optional — one file: PDF, MP4 video, MP3/WAV audio (up to ${MAX_FILE_MB} MB). It is view-only on the site and cannot be downloaded; convert Word/PowerPoint files to PDF first.`
                    )}
                  </Typography>
                  {file && (() => {
                    const info = fileKindInfo(file.name, lang);
                    const Icon = info.icon;
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, flexWrap: "wrap" }}>
                        <Icon fontSize="small" sx={{ color: info.color }} />
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                          {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </Typography>
                        {!submitting && (
                          <Button size="small" color="error" onClick={() => setFile(null)}>
                            {ar("إزالة", "Remove")}
                          </Button>
                        )}
                      </Box>
                    );
                  })()}
                  {fileError && <Alert severity="error" sx={{ mt: 1 }}>{fileError}</Alert>}
                  {submitting && file && (
                    <Box sx={{ mt: 1.5 }}>
                      <LinearProgress variant="determinate" value={progress} />
                      <Typography variant="caption" color="text.secondary">
                        {ar(`جارٍ الرفع… ${progress}%`, `Uploading… ${progress}%`)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting || videoInvalid}
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
