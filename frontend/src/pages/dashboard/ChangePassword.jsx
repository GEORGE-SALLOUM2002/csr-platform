/** تغيير كلمة المرور للمستخدم الحالي (متاح لأي دور مسجّل الدخول). */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Card, CardContent, Box, TextField, Button, Alert, Stack, CircularProgress } from "@mui/material";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import { PageHeader } from "../../components/ui";
import { AuthAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";

const EMPTY = { old_password: "", new_password: "", new_password2: "" };

export default function ChangePassword() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirm } = useConfirm();
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDone(false);
    if (form.new_password !== form.new_password2) {
      setError(ar("كلمتا المرور الجديدتان غير متطابقتين.", "New passwords do not match."));
      return;
    }
    if (!(await confirm({
      message: ar("هل تريد تغيير كلمة المرور؟", "Change your password?"),
      confirmText: t("common.save"),
    }))) return;
    setSubmitting(true);
    try {
      await AuthAPI.changePassword(form);
      setDone(true);
      setForm(EMPTY);
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
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.changePassword")} />
      <Card elevation={0}>
        <CardContent component="form" onSubmit={onSubmit} sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2.5}>
            {done && <Alert severity="success">{ar("تم تغيير كلمة المرور بنجاح.", "Password changed successfully.")}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label={ar("كلمة المرور الحالية", "Current password")}
              type="password"
              value={form.old_password}
              onChange={set("old_password")}
              required
              fullWidth
              autoComplete="current-password"
            />
            <TextField
              label={ar("كلمة المرور الجديدة", "New password")}
              type="password"
              value={form.new_password}
              onChange={set("new_password")}
              required
              fullWidth
              autoComplete="new-password"
              helperText={ar("٨ أحرف على الأقل، ولا تكون شائعة أو رقمية بالكامل.", "At least 8 characters, not too common or entirely numeric.")}
            />
            <TextField
              label={ar("تأكيد كلمة المرور الجديدة", "Confirm new password")}
              type="password"
              value={form.new_password2}
              onChange={set("new_password2")}
              required
              fullWidth
              autoComplete="new-password"
            />
            <Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockResetRoundedIcon />}
                disabled={submitting}
              >
                {t("common.save")}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
