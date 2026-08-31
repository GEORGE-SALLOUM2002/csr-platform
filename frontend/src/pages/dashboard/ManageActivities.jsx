/** إدارة الأنشطة والمؤتمرات: إضافة/تعديل/حذف نشاط مع صورة غلاف وملفات علمية. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, TextField, MenuItem, Button, Stack,
  IconButton, Snackbar, Alert, Divider,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { ContentAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const CATS = ["CONFERENCE", "WORKSHOP", "SEMINAR"];
const EMPTY = {
  title_ar: "", title_en: "", description_ar: "", description_en: "",
  category: "CONFERENCE", date: "", location_ar: "", location_en: "", video_url: "",
};

export default function ManageActivities() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { data, loading, error, reload } = useFetch(() => ContentAPI.activities(), []);
  const items = asList(data);
  const { confirmDelete, confirmSave } = useConfirm();

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [cover, setCover] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  // نموذج إضافة ملف علمي
  const [fileForm, setFileForm] = useState({ title_ar: "", title_en: "" });
  const [fileToUpload, setFileToUpload] = useState(null);

  const editing = items.find((a) => a.id === editingId) || null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const notify = (msg, type = "success") => setSnack({ open: true, msg, type });

  const startEdit = (a) => {
    setEditingId(a.id);
    setCover(null);
    setForm({
      title_ar: a.title_ar || "", title_en: a.title_en || "",
      description_ar: a.description_ar || "", description_en: a.description_en || "",
      category: a.category || "CONFERENCE", date: a.date || "",
      location_ar: a.location_ar || "", location_en: a.location_en || "", video_url: a.video_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(EMPTY); setCover(null); };

  const submit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(!!editingId))) return;
    setBusy(true);
    try {
      const fd = new FormData();
      ["title_ar", "title_en", "description_ar", "description_en", "category", "location_ar", "location_en", "video_url"]
        .forEach((k) => fd.append(k, form[k]));
      if (form.date) fd.append("date", form.date);
      if (cover) fd.append("cover_image", cover);
      if (editingId) await ContentAPI.updateActivity(editingId, fd);
      else await ContentAPI.createActivity(fd);
      notify(ar("تم الحفظ بنجاح.", "Saved successfully."));
      cancelEdit();
      reload();
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const removeActivity = async (id) => {
    if (!(await confirmDelete())) return;
    setBusy(true);
    try {
      await ContentAPI.deleteActivity(id);
      if (editingId === id) cancelEdit();
      notify(ar("تم الحذف.", "Deleted."));
      reload();
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const addFile = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    if (!(await confirmSave(false))) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("activity", editingId);
      fd.append("title_ar", fileForm.title_ar);
      fd.append("title_en", fileForm.title_en);
      fd.append("file", fileToUpload);
      await ContentAPI.createActivityFile(fd);
      setFileForm({ title_ar: "", title_en: "" });
      setFileToUpload(null);
      notify(ar("تمت إضافة الملف.", "File added."));
      reload();
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (id) => {
    if (!(await confirmDelete())) return;
    setBusy(true);
    try {
      await ContentAPI.deleteActivityFile(id);
      notify(ar("تم حذف الملف.", "File deleted."));
      reload();
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.manageActivities")} />

      {/* نموذج الإضافة/التعديل */}
      <Card elevation={0} sx={{ mb: 4, borderColor: editingId ? "primary.main" : undefined }}>
        <CardContent component="form" onSubmit={submit}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {editingId ? ar("تعديل النشاط", "Edit activity") : ar("إضافة نشاط/مؤتمر", "Add activity/conference")}
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField label={t("dashboard.title_ar")} value={form.title_ar} onChange={set("title_ar")} required />
              <TextField label={t("dashboard.title_en")} value={form.title_en} onChange={set("title_en")} />
              <TextField select label={ar("النوع", "Type")} value={form.category} onChange={set("category")}>
                {CATS.map((c) => <MenuItem key={c} value={c}>{t(`categories.${c}`)}</MenuItem>)}
              </TextField>
              <TextField type="date" label={t("common.date")} value={form.date} onChange={set("date")} InputLabelProps={{ shrink: true }} />
              <TextField label={ar("المكان (عربي)", "Location (Arabic)")} value={form.location_ar} onChange={set("location_ar")} />
              <TextField label={ar("المكان (إنجليزي)", "Location (English)")} value={form.location_en} onChange={set("location_en")} />
            </Box>
            <TextField label={ar("الوصف (عربي)", "Description (Arabic)")} value={form.description_ar} onChange={set("description_ar")} multiline minRows={2} />
            <TextField label={ar("الوصف (إنجليزي)", "Description (English)")} value={form.description_en} onChange={set("description_en")} multiline minRows={2} />
            <TextField label={ar("رابط فيديو (اختياري)", "Video URL (optional)")} value={form.video_url} onChange={set("video_url")} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
                {ar("صورة الغلاف", "Cover image")}
                <input hidden type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
              </Button>
              {cover && <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>{cover.name}</Typography>}
              {!cover && editing?.cover_image && (
                <Box component="img" src={editing.cover_image} alt="" sx={{ height: 46, borderRadius: 1 }} />
              )}
            </Box>

            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Button type="submit" variant="contained" disabled={busy}>
                {editingId ? t("common.save") : ar("إضافة", "Add")}
              </Button>
              {editingId && <Button onClick={cancelEdit} disabled={busy}>{t("common.cancel")}</Button>}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* إدارة الملفات العلمية (عند تعديل نشاط قائم) */}
      {editing && (
        <Card elevation={0} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {t("activities.files")} — {tr(editing, "title", lang)}
            </Typography>
            {editing.files && editing.files.length > 0 ? (
              <Stack spacing={1} sx={{ mb: 2 }}>
                {editing.files.map((f) => (
                  <Box key={f.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, p: 1, border: 1, borderColor: "divider", borderRadius: 2 }}>
                    <Box component="a" href={f.file} target="_blank" rel="noopener" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {tr(f, "title", lang)}
                    </Box>
                    <IconButton size="small" color="error" disabled={busy} onClick={() => removeFile(f.id)}><DeleteRoundedIcon /></IconButton>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ mb: 2 }}>{ar("لا توجد ملفات بعد.", "No files yet.")}</Typography>
            )}
            <Box component="form" onSubmit={addFile}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <TextField size="small" label={ar("عنوان الملف (عربي)", "File title (Arabic)")} value={fileForm.title_ar} onChange={(e) => setFileForm((f) => ({ ...f, title_ar: e.target.value }))} required />
                <TextField size="small" label={ar("عنوان الملف (إنجليزي)", "File title (English)")} value={fileForm.title_en} onChange={(e) => setFileForm((f) => ({ ...f, title_en: e.target.value }))} />
                <Button component="label" variant="outlined" size="small" startIcon={<UploadFileRoundedIcon />}>
                  {ar("اختيار ملف", "Choose file")}
                  <input hidden type="file" onChange={(e) => setFileToUpload(e.target.files?.[0] || null)} />
                </Button>
                <Button type="submit" variant="contained" size="small" disabled={busy || !fileToUpload}>{t("common.add")}</Button>
              </Stack>
              {fileToUpload && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>{fileToUpload.name}</Typography>}
            </Box>
          </CardContent>
        </Card>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* قائمة الأنشطة */}
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
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {a.cover_image && <Box component="img" src={a.cover_image} alt="" sx={{ width: 64, height: 48, objectFit: "cover", borderRadius: 1, flexShrink: 0 }} />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>{tr(a, "title", lang)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t(`categories.${a.category}`)}{a.date ? ` · ${new Date(a.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}` : ""}
                  </Typography>
                </Box>
                <IconButton color="primary" disabled={busy} onClick={() => startEdit(a)} aria-label={t("common.edit")}><EditRoundedIcon /></IconButton>
                <IconButton color="error" disabled={busy} onClick={() => removeActivity(a.id)} aria-label={t("common.delete")}><DeleteRoundedIcon /></IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.type} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}
