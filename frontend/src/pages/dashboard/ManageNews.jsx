/** إدارة الأخبار: إضافة/تعديل/حذف الأخبار — النص بمحرّر غني يدعم إدراج الصور ضمن النص. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Button, Stack, TextField,
  Switch, FormControlLabel, IconButton, Snackbar, Alert,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import RichEditor from "../../components/RichEditor";
import { useFetch, asList } from "../../hooks/useFetch";
import { ContentAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = { title_ar: "", title_en: "", body_ar: "", body_en: "", publish_at: "", is_published: true };
const toInput = (iso) => (iso ? String(iso).slice(0, 16) : "");

export default function ManageNews() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirmDelete, confirmSave } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.news(), []);
  const items = asList(data);

  const [form, setForm] = useState(EMPTY);
  const [formKey, setFormKey] = useState(0); // يُعيد تهيئة المحرّر الغني عند التبديل
  const [editingId, setEditingId] = useState(null);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(false);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setHtml = (k) => (html) => setForm((f) => ({ ...f, [k]: html }));
  const bumpKey = () => setFormKey((k) => k + 1);

  const startEdit = (n) => {
    setEditingId(n.id);
    setImage(null);
    setForm({
      title_ar: n.title_ar || "",
      title_en: n.title_en || "",
      body_ar: n.body_ar || "",
      body_en: n.body_en || "",
      publish_at: toInput(n.publish_at),
      is_published: n.is_published !== false,
    });
    bumpKey(); // يُحمّل نص الخبر داخل المحرّر
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setImage(null);
    bumpKey();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(!!editingId))) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title_ar", form.title_ar);
      fd.append("title_en", form.title_en);
      fd.append("body_ar", form.body_ar);
      fd.append("body_en", form.body_en);
      fd.append("is_published", form.is_published);
      if (form.publish_at) fd.append("publish_at", form.publish_at);
      if (image) fd.append("image", image);
      if (editingId) await ContentAPI.updateNews(editingId, fd);
      else await ContentAPI.createNews(fd);
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
      await ContentAPI.deleteNews(id);
      if (editingId === id) cancelEdit();
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.manageNews")} />

      <Card elevation={0} sx={{ mb: 4, borderColor: editingId ? "primary.main" : undefined }}>
        <CardContent component="form" onSubmit={submit}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {editingId ? ar("تعديل الخبر", "Edit news") : t("dashboard.addNews")}
          </Typography>

          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label={t("dashboard.title_ar")} value={form.title_ar} onChange={setField("title_ar")} required />
              <TextField label={t("dashboard.title_en")} value={form.title_en} onChange={setField("title_en")} required />
            </Box>

            {/* النص بمحرّر غني (يدعم إدراج الصور ضمن النص) */}
            <RichEditor
              key={`nar-${formKey}`}
              dir="rtl"
              label={ar("النص (عربي)", "Body (Arabic)")}
              value={form.body_ar}
              onChange={setHtml("body_ar")}
            />
            <RichEditor
              key={`nen-${formKey}`}
              dir="ltr"
              label={ar("النص (إنجليزي)", "Body (English)")}
              value={form.body_en}
              onChange={setHtml("body_en")}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, alignItems: "center" }}>
              <TextField label={t("dashboard.publishAt")} type="datetime-local" value={form.publish_at} onChange={setField("publish_at")} InputLabelProps={{ shrink: true }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button variant="outlined" component="label">
                  {ar("صورة الغلاف", "Cover image")} ({t("common.optional")})
                  <input hidden type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                </Button>
                {image && (
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                    {image.name}
                  </Typography>
                )}
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Switch checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />}
                label={t("dashboard.active")}
              />
              <Button type="submit" variant="contained" disabled={busy}>
                {editingId ? t("common.save") : t("dashboard.addNews")}
              </Button>
              {editingId && (
                <Button onClick={cancelEdit} disabled={busy}>
                  {t("common.cancel")}
                </Button>
              )}
            </Stack>
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
          {items.map((n) => (
            <Card key={n.id} elevation={0} sx={{ borderColor: editingId === n.id ? "primary.main" : undefined }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {tr(n, "title", lang)}
                  </Typography>
                  {n.publish_at && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(n.publish_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton color="primary" disabled={busy} onClick={() => startEdit(n)} aria-label={t("common.edit")}>
                    <EditRoundedIcon />
                  </IconButton>
                  <IconButton color="error" disabled={busy} onClick={() => remove(n.id)} aria-label={t("common.delete")}>
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
