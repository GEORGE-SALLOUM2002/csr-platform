/** إدارة المشرفين (لمدير النظام فقط): إضافة حساب مشرف جديد وعرض/حذف المشرفين الحاليين. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Button, TextField,
  IconButton, Avatar, Chip, Snackbar, Alert, CircularProgress, InputAdornment,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { AdminAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";

const EMPTY = { full_name: "", email: "", password: "", password2: "" };

export default function ManageEditors() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirmSave, confirmDelete } = useConfirm();

  const { data, loading, error, reload } = useFetch(() => AdminAPI.users({ role: "EDITOR" }), []);
  const editors = asList(data);

  const [form, setForm] = useState(EMPTY);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [snack, setSnack] = useState({ open: false, severity: "success", msg: "" });

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const openSnack = (severity, msg) => setSnack({ open: true, severity, msg });

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (form.password !== form.password2) {
      setFormError(ar("كلمتا المرور غير متطابقتين.", "Passwords do not match."));
      return;
    }
    if (!(await confirmSave(false))) return;
    setBusy(true);
    try {
      await AdminAPI.createEditor(form);
      setForm(EMPTY);
      openSnack("success", ar("تمت إضافة المشرف بنجاح.", "Editor added successfully."));
      reload();
    } catch (err) {
      const d = err.response?.data;
      let msg = "";
      if (d && typeof d === "object") msg = Object.values(d).flat().join(" ");
      setFormError(msg || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (u) => {
    if (!(await confirmDelete(
      ar(`حذف المشرف «${u.full_name}» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`,
         `Permanently delete editor “${u.full_name}”? This cannot be undone.`)
    ))) return;
    setBusy(true);
    try {
      await AdminAPI.remove(u.id);
      openSnack("success", ar("تم حذف المشرف.", "Editor deleted."));
      reload();
    } catch (err) {
      const d = err.response?.data;
      openSnack("error", d?.detail || t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        eyebrow={t("nav.dashboard")}
        title={t("dashboard.manageEditors")}
        subtitle={ar("أضِف حسابات المشرفين العلميين أو احذفها. المشرف يستطيع إدارة المحتوى ومراجعته.",
                     "Add or remove scientific editor accounts. Editors can manage and review content.")}
      />

      {/* بطاقة إضافة مشرف */}
      <Card elevation={0} sx={{ mb: 4 }}>
        <CardContent component="form" onSubmit={submit} sx={{ p: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontWeight: 700, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <PersonAddAlt1RoundedIcon color="primary" />
            {ar("إضافة مشرف جديد", "Add a new editor")}
          </Typography>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label={t("auth.fullName")}
              value={form.full_name}
              onChange={setField("full_name")}
              required
              fullWidth
              autoComplete="off"
            />
            <TextField
              label={t("auth.email")}
              type="email"
              value={form.email}
              onChange={setField("email")}
              required
              fullWidth
              autoComplete="off"
              dir="ltr"
            />
            <TextField
              label={t("auth.password")}
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={setField("password")}
              required
              fullWidth
              autoComplete="new-password"
              helperText={ar("٨ أحرف على الأقل، ولا تكون شائعة أو رقمية بالكامل.",
                             "At least 8 characters, not too common or entirely numeric.")}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((s) => !s)} edge="end" tabIndex={-1}
                      aria-label={showPw ? ar("إخفاء", "Hide") : ar("إظهار", "Show")}>
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label={t("auth.confirmPassword")}
              type={showPw ? "text" : "password"}
              value={form.password2}
              onChange={setField("password2")}
              required
              fullWidth
              autoComplete="new-password"
            />
          </Box>

          <Box sx={{ mt: 2.5 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={busy}
              startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <PersonAddAlt1RoundedIcon />}
            >
              {t("common.add")}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* قائمة المشرفين الحاليين */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: "1.05rem" }}>
        {ar("المشرفون الحاليون", "Current editors")}
        {editors.length > 0 && (
          <Chip label={editors.length} size="small" sx={{ ml: 1 }} />
        )}
      </Typography>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : editors.length === 0 ? (
        <EmptyState label={ar("لا يوجد مشرفون بعد. أضِف أول مشرف من الأعلى.", "No editors yet. Add the first one above.")} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          {editors.map((u) => (
            <Card key={u.id} elevation={0}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  {u.full_name?.charAt(0) || "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>{u.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary" noWrap dir="ltr" sx={{ textAlign: lang === "ar" ? "right" : "left" }}>
                    {u.email}
                  </Typography>
                  <Box sx={{ mt: 0.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    <Chip
                      label={u.is_active ? t("dashboard.active") : ar("موقوف", "Disabled")}
                      size="small"
                      color={u.is_active ? "success" : "default"}
                      variant="outlined"
                      sx={{ height: 20, fontSize: ".7rem" }}
                    />
                  </Box>
                </Box>
                <IconButton color="error" disabled={busy} onClick={() => remove(u)} aria-label={t("common.delete")}>
                  <DeleteRoundedIcon />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
