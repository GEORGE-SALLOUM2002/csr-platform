/** تعيين كلمة مرور جديدة عبر الرابط الوارد في البريد (uid + token في عنوان الصفحة). */
import { useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, Button, Typography, Alert, Stack, Link, CircularProgress,
} from "@mui/material";
import { AuthAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import PasswordField from "../../components/PasswordField";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const badLink = !uid || !token;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (pw !== pw2) {
      setError(ar("كلمتا المرور غير متطابقتين.", "Passwords do not match."));
      return;
    }
    setSubmitting(true);
    try {
      await AuthAPI.confirmPasswordReset({ uid, token, new_password: pw, new_password2: pw2 });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      const data = err.response?.data;
      let msg = "";
      if (data && typeof data === "object") msg = Object.values(data).flat().join(" ");
      setError(msg || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            {t("auth.resetTitle")}
          </Typography>

          {badLink ? (
            <Stack spacing={3}>
              <Alert severity="error">
                {ar(
                  "الرابط غير مكتمل أو غير صالح. الرجاء طلب رابط إعادة تعيين جديد.",
                  "This link is incomplete or invalid. Please request a new reset link."
                )}
              </Alert>
              <Button component={RouterLink} to="/forgot-password" variant="contained" size="large">
                {t("auth.forgotTitle")}
              </Button>
            </Stack>
          ) : done ? (
            <Stack spacing={3}>
              <Alert severity="success">
                {ar(
                  "تم تعيين كلمة المرور الجديدة بنجاح. سيتم تحويلك لتسجيل الدخول…",
                  "Your new password is set. Redirecting you to sign in…"
                )}
              </Alert>
              <Button component={RouterLink} to="/login" variant="contained" size="large">
                {t("auth.login")}
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2.5}>
                {error && <Alert severity="error">{error}</Alert>}
                <PasswordField
                  label={ar("كلمة المرور الجديدة", "New password")}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                  helperText={ar("٨ أحرف على الأقل، ولا تكون شائعة أو رقمية بالكامل.", "At least 8 characters, not too common or entirely numeric.")}
                />
                <PasswordField
                  label={ar("تأكيد كلمة المرور الجديدة", "Confirm new password")}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  required
                  fullWidth
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {t("auth.resetSubmit")}
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
