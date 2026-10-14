/** الإعلانات الذكية: إضافة/تعديل/حذف. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Button, Stack, TextField, MenuItem,
  Switch, FormControlLabel, IconButton, Chip, Snackbar, Alert,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { ContentAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = {
  title_ar: "", title_en: "", link: "", is_pinned: false, is_active: true, expires_at: "",
  video_url: "", bg_color: "", text_color: "", placement: "BOTH",
};
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
  const [image, setImage] = useState(null);        // صورة جديدة مختارة
  const [clearImage, setClearImage] = useState(false); // طلب حذف الصورة الحالية

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const currentImage = items.find((a) => a.id === editingId)?.image || null;

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title_ar: a.title_ar || "",
      title_en: a.title_en || "",
      link: a.link || "",
      is_pinned: a.is_pinned === true,
      is_active: a.is_active !== false,
      expires_at: toInput(a.expires_at),
      video_url: a.video_url || "",
      bg_color: a.bg_color || "",
      text_color: a.text_color || "",
      placement: a.placement || "BOTH",
    });
    setImage(null);
    setClearImage(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
    setImage(null);
    setClearImage(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(!!editingId))) return;
    setBusy(true);
    try {
      // FormData لأن الإعلان قد يحمل صورة
      const fd = new FormData();
      fd.append("title_ar", form.title_ar);
      fd.append("title_en", form.title_en);
      fd.append("link", form.link);
      fd.append("is_pinned", form.is_pinned ? "true" : "false");
      // إلزامي مع multipart: الحقل الغائب يُقرأ false فيصبح الإعلان غير مفعّل
      fd.append("is_active", form.is_active ? "true" : "false");
      if (form.expires_at) fd.append("expires_at", form.expires_at);
      fd.append("video_url", form.video_url);
      fd.append("bg_color", form.bg_color);
      fd.append("text_color", form.text_color);
      fd.append("placement", form.placement);
      if (image) fd.append("image", image);
      else if (clearImage) fd.append("image", "");
      if (editingId) await ContentAPI.updateAnnouncement(editingId, fd);
      else await ContentAPI.createAnnouncement(fd);
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
            <TextField
              label={lang === "ar" ? "رابط فيديو (اختياري)" : "Video link (optional)"}
              value={form.video_url}
              onChange={setField("video_url")}
              placeholder="https://www.youtube.com/watch?v=…"
              sx={{ gridColumn: { sm: "1 / -1" } }}
              helperText={lang === "ar"
                ? "يُعرض الفيديو في شريط الصفحة الرئيسية. يُقبل رابط YouTube أو Microsoft."
                : "Plays in the home page banner. YouTube or Microsoft links."}
            />
            <TextField
              select
              label={lang === "ar" ? "موضع الإعلان" : "Placement"}
              value={form.placement}
              onChange={setField("placement")}
              sx={{ gridColumn: { sm: "1 / -1" } }}
              helperText={lang === "ar"
                ? "الشريط العلوي يظهر في كل الصفحات، وقسم «أحدث الإعلانات والمؤتمرات» في الصفحة الرئيسية."
                : "The top strip shows on every page; the latest-announcements banner is on the home page."}
            >
              <MenuItem value="BAR">
                {lang === "ar" ? "أعلى الصفحة فقط" : "Top strip only"}
              </MenuItem>
              <MenuItem value="BOTH">
                {lang === "ar" ? "أعلى الصفحة ومع أحدث الإعلانات والمؤتمرات" : "Top strip + latest announcements"}
              </MenuItem>
            </TextField>
          </Box>

          {/* الصورة والألوان */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mt: 2, flexWrap: "wrap" }} useFlexGap>
            <Button component="label" variant="outlined" startIcon={<ImageRoundedIcon />}>
              {lang === "ar" ? "صورة الإعلان" : "Announcement image"}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => { setImage(e.target.files?.[0] || null); setClearImage(false); e.target.value = ""; }}
              />
            </Button>
            {image && (
              <Chip label={image.name} onDelete={() => setImage(null)} size="small" />
            )}
            {!image && editingId && currentImage && !clearImage && (
              <Chip
                label={lang === "ar" ? "صورة محفوظة" : "Saved image"}
                onDelete={() => setClearImage(true)}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            {clearImage && (
              <Chip
                label={lang === "ar" ? "ستُحذف الصورة" : "Image will be removed"}
                onDelete={() => setClearImage(false)}
                size="small"
                color="error"
                variant="outlined"
              />
            )}

            <ColorField
              label={lang === "ar" ? "لون الخلفية" : "Background color"}
              value={form.bg_color}
              onChange={(v) => setForm((f) => ({ ...f, bg_color: v }))}
            />
            <ColorField
              label={lang === "ar" ? "لون النص" : "Text color"}
              value={form.text_color}
              onChange={(v) => setForm((f) => ({ ...f, text_color: v }))}
            />
          </Stack>
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
                    {a.placement === "BAR" && (
                      <Chip
                        label={lang === "ar" ? "أعلى الصفحة فقط" : "Top strip only"}
                        size="small"
                        variant="outlined"
                      />
                    )}
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

/** اختيار لون: مربّع لون + زر لإعادة اللون الافتراضي (قيمة فارغة = ألوان الموقع). */
function ColorField({ label, value, onChange }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <TextField
        label={label}
        type="color"
        size="small"
        value={value || "#0A5A59"}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        InputLabelProps={{ shrink: true }}
        sx={{ width: 120 }}
      />
      {value && (
        <IconButton size="small" onClick={() => onChange("")} aria-label="reset color">
          <RestartAltRoundedIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );
}
