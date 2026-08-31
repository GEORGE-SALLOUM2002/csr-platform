/** الإعلانات الذكية: إضافة/تعديل/حذف. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Button, Stack, TextField,
  Switch, FormControlLabel, IconButton, Chip, Snackbar, Alert,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { ContentAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = { title_ar: "", title_en: "", link: "", is_pinned: false, expires_at: "" };
const toInput = (iso) => (iso ? String(iso).slice(0, 16) : "");

export default function ManageAnnouncements() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.announcements(), []);
  const items = asList(data);
  const { confirmDelete, confirmSave } = useConfirm();

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title_ar: a.title_ar || "",
      title_en: a.title_en || "",
      link: a.link || "",
      is_pinned: a.is_pinned === true,
      expires_at: toInput(a.expires_at),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(!!editingId))) return;
    setBusy(true);
    try {
      const payload = {
        title_ar: form.title_ar,
        title_en: form.title_en,
        link: form.link,
        is_pinned: form.is_pinned,
        expires_at: form.expires_at || null,
      };
      if (editingId) await ContentAPI.updateAnnouncement(editingId, payload);
      else await ContentAPI.createAnnouncement(payload);
      cancelEdit();
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
      await ContentAPI.deleteAnnouncement(id);
      if (editingId === id) cancelEdit();
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.manageAnnouncements")} />

      <Card elevation={0} sx={{ mb: 4, borderColor: editingId ? "primary.main" : undefined }}>
        <CardContent component="form" onSubmit={submit}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {editingId ? (lang === "ar" ? "تعديل الإعلان" : "Edit announcement") : t("dashboard.addAnnouncement")}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField label={t("dashboard.title_ar")} value={form.title_ar} onChange={setField("title_ar")} required />
            <TextField label={t("dashboard.title_en")} value={form.title_en} onChange={setField("title_en")} required />
            <TextField label={lang === "ar" ? "الرابط" : "Link"} value={form.link} onChange={setField("link")} />
            <TextField label={t("dashboard.expiresAt")} type="datetime-local" value={form.expires_at} onChange={setField("expires_at")} InputLabelProps={{ shrink: true }} />
          </Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2, flexWrap: "wrap" }}>
            <FormControlLabel
              control={<Switch checked={form.is_pinned} onChange={(e) => setForm((f) => ({ ...f, is_pinned: e.target.checked }))} />}
              label={t("dashboard.pinned")}
            />
            <Button type="submit" variant="contained" disabled={busy}>
              {editingId ? t("common.save") : t("dashboard.addAnnouncement")}
            </Button>
            {editingId && (
              <Button onClick={cancelEdit} disabled={busy}>
                {t("common.cancel")}
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={1.5}>
          {items.map((a) => (
            <Card key={a.id} elevation={0} sx={{ borderColor: editingId === a.id ? "primary.main" : undefined }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {tr(a, "title", lang)}
                    </Typography>
                    {a.is_pinned && <Chip label={t("dashboard.pinned")} size="small" color="primary" />}
                  </Stack>
                  {a.expires_at && (
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard.expiresAt")}: {new Date(a.expires_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton color="primary" disabled={busy} onClick={() => startEdit(a)} aria-label={t("common.edit")}>
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton color="error" disabled={busy} onClick={() => remove(a.id)} aria-label={t("common.delete")}>
                    <DeleteRoundedIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" onClose={() => setSnack(false)} sx={{ width: "100%" }}>
          {t("common.saved")}
        </Alert>
      </Snackbar>
    </Container>
  );
}
