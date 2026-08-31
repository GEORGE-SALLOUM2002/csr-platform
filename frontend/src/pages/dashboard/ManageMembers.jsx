/** الأعضاء: إضافة عضو مجلس إدارة وعرض/حذف الأعضاء الحاليين. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Button, Stack, TextField,
  IconButton, Avatar, Snackbar, Alert,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { ContentAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = { name_ar: "", name_en: "", role_ar: "", role_en: "", order: "" };

export default function ManageMembers() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.board(), []);
  const items = asList(data);
  const { confirmDelete, confirmSave } = useConfirm();

  const [form, setForm] = useState(EMPTY);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(false))) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name_ar", form.name_ar);
      fd.append("name_en", form.name_en);
      fd.append("role_ar", form.role_ar);
      fd.append("role_en", form.role_en);
      if (form.order !== "") fd.append("order", form.order);
      if (photo) fd.append("photo", photo);
      await ContentAPI.createBoard(fd);
      setForm(EMPTY);
      setPhoto(null);
      setSnack(true);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!(await confirmDelete())) return;
    setBusy(true);
    try {
      await ContentAPI.deleteBoard(id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.members")} />

      <Card elevation={0} sx={{ mb: 4 }}>
        <CardContent component="form" onSubmit={submit}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField
              label={lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              value={form.name_ar}
              onChange={setField("name_ar")}
              required
            />
            <TextField
              label={lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}
              value={form.name_en}
              onChange={setField("name_en")}
              required
            />
            <TextField
              label={lang === "ar" ? "المنصب (عربي)" : "Role (Arabic)"}
              value={form.role_ar}
              onChange={setField("role_ar")}
            />
            <TextField
              label={lang === "ar" ? "المنصب (إنجليزي)" : "Role (English)"}
              value={form.role_en}
              onChange={setField("role_en")}
            />
            <TextField
              label={lang === "ar" ? "الترتيب" : "Order"}
              type="number"
              value={form.order}
              onChange={setField("order")}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button variant="outlined" component="label">
                {t("dashboard.photo")} ({t("common.optional")})
                <input hidden type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
              </Button>
              {photo && (
                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                  {photo.name}
                </Typography>
              )}
            </Box>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" disabled={busy}>
              {t("common.add")}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
          {items.map((m) => (
            <Card key={m.id} elevation={0}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar src={m.photo || undefined} sx={{ width: 56, height: 56 }}>
                  {m.name_ar ? m.name_ar[0] : "?"}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {tr(m, "name", lang)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {tr(m, "role", lang)}
                  </Typography>
                </Box>
                <IconButton color="error" disabled={busy} onClick={() => remove(m.id)} aria-label={t("common.delete")}>
                  <DeleteRoundedIcon />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" onClose={() => setSnack(false)} sx={{ width: "100%" }}>
          {t("common.saved")}
        </Alert>
      </Snackbar>
    </Container>
  );
}
