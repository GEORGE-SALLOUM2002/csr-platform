/** طلب إعادة تعيين كلمة المرور: إدخال البريد الإلكتروني لإرسال رابط إعادة التعيين. */
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, TextField, Button, Typography, Alert, Stack, Link, CircularProgress,
} from "@mui/material";
import { AuthAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AuthAPI.requestPasswordReset(email);
    } catch {
      // نُظهر النجاح دائماً (لا نكشف إن كان البريد مسجّلاً)
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {t("auth.forgotTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {ar(
              "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
              "Enter your email and we'll send you a link to reset your password."
            )}
          </Typography>

          {done ? (
            <Stack spacing={3}>
              <Alert severity="success">
                {ar(
                  "إن كان البريد مسجّلاً لدينا فستصلك رسالة بخطوات إعادة التعيين خلال دقائق. تحقّق أيضاً من مجلد الرسائل غير المرغوبة.",
                  "If that email is registered, you'll receive reset instructions shortly. Please also check your spam folder."
                )}
              </Alert>
              <Button component={RouterLink} to="/login" variant="contained" size="large">
                {t("auth.login")}
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  type="email"
                  label={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoComplete="email"
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                >
                  {t("auth.sendResetLink")}
                </Button>
              </Stack>
            </Box>
          )}

          <Typography sx={{ mt: 3, textAlign: "center" }}>
            <Link component={RouterLink} to="/login">
              {ar("العودة لتسجيل الدخول", "Back to sign in")}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
