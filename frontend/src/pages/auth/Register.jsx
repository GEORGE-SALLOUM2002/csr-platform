/** طلب انتساب طبيب: تعبئة كامل الملف الشخصي + إرفاق مستندات إثبات (١–٣ ملفات). */
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, TextField, Button, Typography, Alert, Stack, Link,
  CircularProgress, List, ListItem, ListItemText, Divider,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UISettingsContext";
import PasswordField from "../../components/PasswordField";

const EMPTY = {
  full_name: "", email: "", password: "", password2: "",
  specialty_ar: "", specialty_en: "", degree_ar: "", degree_en: "",
  workplace_ar: "", workplace_en: "", bio_ar: "", bio_en: "", phone: "", proof_url: "",
};

const MAX_DOC_MB = 5;
const ALLOWED_DOC_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFiles = (e) => {
    let arr = Array.from(e.target.files || []);
    setFileError("");
    // نوع الملف
    const badType = arr.find((f) => !ALLOWED_DOC_TYPES.includes(f.type));
    if (badType) {
      setFileError(ar(
        `نوع الملف «${badType.name}» غير مسموح. المسموح: صور JPG/PNG/WebP أو PDF.`,
        `File "${badType.name}" type not allowed. Allowed: JPG/PNG/WebP images or PDF.`
      ));
      e.target.value = "";
      return;
    }
    // حجم الملف
    const tooBig = arr.find((f) => f.size > MAX_DOC_MB * 1024 * 1024);
    if (tooBig) {
      setFileError(ar(
        `الملف «${tooBig.name}» يتجاوز الحد الأقصى (${MAX_DOC_MB} ميغابايت).`,
        `File "${tooBig.name}" exceeds the ${MAX_DOC_MB} MB limit.`
      ));
      e.target.value = "";
      return;
    }
    // عدد الملفات
    if (arr.length > 3) {
      setFileError(ar("يُسمح بحد أقصى ٣ ملفات — تم الاكتفاء بأول ٣.", "Max 3 files — kept the first 3."));
      arr = arr.slice(0, 3);
    }
    setFiles(arr);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors("");
    if (files.length < 1 && !form.proof_url.trim()) {
      setErrors(ar(
        "يجب إرفاق مستند إثبات (صورة أو ملف) أو إدخال رابط إثبات على الأقل.",
        "Please attach a proof document (image or file) or enter a proof link."
      ));
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append("documents", f));
      await register(fd);
      setDone(true);
    } catch (err) {
      const data = err.response?.data;
      let msg = "";
      if (data && typeof data === "object") msg = Object.values(data).flat().join(" ");
      setErrors(msg || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = (name, labelAr, labelEn, opts = {}) => (
    <TextField
      label={ar(labelAr, labelEn)}
      value={form[name]}
      onChange={set(name)}
      fullWidth
      {...opts}
    />
  );

  const pwdField = (name, labelAr, labelEn, opts = {}) => (
    <PasswordField
      label={ar(labelAr, labelEn)}
      value={form[name]}
      onChange={set(name)}
      fullWidth
      {...opts}
    />
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            {t("auth.registerTitle")}
          </Typography>

          {done ? (
            <Stack spacing={3}>
              <Alert severity="success">{t("auth.registerSuccess")}</Alert>
              <Button component={RouterLink} to="/login" variant="contained" size="large">
                {t("auth.login")}
              </Button>
            </Stack>
          ) : (
            <>
              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2.5}>
                  {errors && <Alert severity="error">{errors}</Alert>}

                  <Divider textAlign={lang === "ar" ? "right" : "left"}>
                    <Typography variant="body2" color="text.secondary">{ar("بيانات الحساب", "Account details")}</Typography>
                  </Divider>
                  {field("full_name", "الاسم الكامل", "Full name", { required: true, autoComplete: "name" })}
                  {field("email", "البريد الإلكتروني", "Email", { required: true, type: "email", autoComplete: "email" })}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {pwdField("password", "كلمة المرور", "Password", { required: true, autoComplete: "new-password" })}
                    {pwdField("password2", "تأكيد كلمة المرور", "Confirm password", { required: true, autoComplete: "new-password" })}
                  </Box>

                  <Divider textAlign={lang === "ar" ? "right" : "left"}>
                    <Typography variant="body2" color="text.secondary">{ar("بيانات الملف الشخصي", "Profile details")}</Typography>
                  </Divider>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    {field("specialty_ar", "الاختصاص (عربي)", "Specialty (Arabic)", { required: true })}
                    {field("specialty_en", "الاختصاص (إنجليزي)", "Specialty (English)")}
                    {field("degree_ar", "الدرجة العلمية (عربي)", "Degree (Arabic)", { required: true })}
                    {field("degree_en", "الدرجة العلمية (إنجليزي)", "Degree (English)")}
                    {field("workplace_ar", "جهة العمل (عربي)", "Workplace (Arabic)", { required: true })}
                    {field("workplace_en", "جهة العمل (إنجليزي)", "Workplace (English)")}
                  </Box>
                  {field("phone", "الهاتف", "Phone", { required: true })}
                  {field("bio_ar", "نبذة تعريفية (عربي)", "Bio (Arabic)", { required: true, multiline: true, minRows: 2 })}
                  {field("bio_en", "نبذة تعريفية (إنجليزي)", "Bio (English)", { multiline: true, minRows: 2 })}

                  <Divider textAlign={lang === "ar" ? "right" : "left"}>
                    <Typography variant="body2" color="text.secondary">{ar("إثبات أنك طبيب", "Proof you are a physician")}</Typography>
                  </Divider>
                  <Box>
                    <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
                      {ar("إرفاق صورة أو ملف عن الشهادة (١–٣ ملفات: صور / PDF)", "Attach an image or file of your certificate (1–3 files: images / PDF)")}
                      <input hidden multiple type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onFiles} />
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {ar(`مثال: الشهادة، بطاقة النقابة، أو أي وثيقة رسمية. الحد الأقصى ${MAX_DOC_MB} ميغابايت للملف.`, `e.g. certificate, syndicate card, or any official document. Max ${MAX_DOC_MB} MB per file.`)}
                    </Typography>
                    {fileError && <Alert severity="warning" sx={{ mt: 1 }}>{fileError}</Alert>}
                    {files.length > 0 && (
                      <List dense sx={{ mt: 1, bgcolor: "action.hover", borderRadius: 2 }}>
                        {files.map((f, i) => (
                          <ListItem key={i}>
                            <ListItemText primary={f.name} primaryTypographyProps={{ variant: "body2", noWrap: true }} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                    {ar("— أو —", "— or —")}
                  </Typography>
                  {field("proof_url", "رابط إثبات (مثلاً رابط الشهادة على الإنترنت)", "Proof link (e.g. an online certificate URL)", { type: "url", placeholder: "https://…" })}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
                    {ar("يكفي إرفاق ملف/صورة أو إدخال رابط (أحدهما على الأقل).", "Attach a file/image or enter a link (at least one is required).")}
                  </Typography>

                  <Button type="submit" variant="contained" size="large" disabled={submitting} startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}>
                    {t("auth.register")}
                  </Button>
                </Stack>
              </Box>

              <Typography sx={{ mt: 3, textAlign: "center" }}>
                <Link component={RouterLink} to="/login">{t("auth.haveAccount")}</Link>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
