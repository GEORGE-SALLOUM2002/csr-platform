/** إدارة تصنيفات المكتبة (للمشرف/المدير): إضافة وحذف تصنيفات المحتوى العلمي. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, TextField, Button, Typography, Alert, Stack,
  CircularProgress, List, ListItem, ListItemText, IconButton, Chip, Divider,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { LibraryAPI } from "../../api/services";
import { useFetch, asList } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = { name_ar: "", name_en: "", order: 0 };

export default function ManageCategories() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirm } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => LibraryAPI.categories(), []);
  const items = asList(data);

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!form.name_ar.trim()) {
      setErr(ar("الاسم بالعربية مطلوب.", "Arabic name is required."));
      return;
    }
    setSaving(true);
    try {
      await LibraryAPI.createCategory({
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        order: Number(form.order) || 0,
      });
      setForm(EMPTY);
      setMsg(ar("تمت إضافة التصنيف.", "Category added."));
      reload();
    } catch (e2) {
      const d = e2.response?.data;
      let m = "";
      if (d && typeof d === "object") m = Object.values(d).flat().join(" ");
      setErr(m || t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!(await confirm({
      message: ar(
        `حذف التصنيف «${tr(c, "name", lang)}»؟ لن تتأثر الموارد المرتبطة به إلا بإزالة تصنيفها.`,
        `Delete category "${tr(c, "name", lang)}"? Linked resources keep their data but lose this category.`
      ),
      confirmText: ar("حذف", "Delete"),
      color: "error",
    }))) return;
    try {
      await LibraryAPI.deleteCategory(c.id);
      setMsg(ar("تم حذف التصنيف.", "Category deleted."));
      reload();
    } catch {
      setErr(t("common.error"));
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        eyebrow={t("nav.dashboard")}
        title={t("dashboard.manageCategories")}
        subtitle={ar(
          "تصنيفات المحتوى العلمي التي تظهر للطبيب عند رفع مورد.",
          "Library categories shown to doctors when uploading a resource."
        )}
      />

      {/* نموذج الإضافة */}
      <Card elevation={0} sx={{ mb: 3 }}>
        <CardContent component="form" onSubmit={onSubmit} sx={{ p: { xs: 3, md: 4 } }}>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>{ar("إضافة تصنيف جديد", "Add a new category")}</Typography>
          <Stack spacing={2.5}>
            {msg && <Alert severity="success" onClose={() => setMsg("")}>{msg}</Alert>}
            {err && <Alert severity="error" onClose={() => setErr("")}>{err}</Alert>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" }, gap: 2 }}>
              <TextField label={ar("الاسم (عربي)", "Name (Arabic)")} value={form.name_ar} onChange={set("name_ar")} required fullWidth />
              <TextField label={ar("الاسم (إنجليزي)", "Name (English)")} value={form.name_en} onChange={set("name_en")} fullWidth />
              <TextField label={ar("الترتيب", "Order")} value={form.order} onChange={set("order")} type="number" sx={{ width: { xs: "100%", sm: 110 } }} />
            </Box>
            <Box>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />}
                disabled={saving}
              >
                {ar("إضافة", "Add")}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* قائمة التصنيفات */}
      <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{ar("التصنيفات الحالية", "Current categories")}</Typography>
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState label={ar("لا توجد تصنيفات بعد — أضف أولها من الأعلى.", "No categories yet — add the first one above.")} />
      ) : (
        <Card elevation={0}>
          <List>
            {items.map((c, i) => (
              <Box key={c.id}>
                {i > 0 && <Divider component="li" />}
                <ListItem
                  secondaryAction={
                    <IconButton edge="end" color="error" aria-label="delete" onClick={() => remove(c)}>
                      <DeleteRoundedIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography fontWeight={600}>{c.name_ar}</Typography>
                        {c.name_en && <Typography variant="body2" color="text.secondary" dir="ltr">{c.name_en}</Typography>}
                        <Chip size="small" variant="outlined" label={`${ar("ترتيب", "order")}: ${c.order ?? 0}`} />
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Card>
      )}
    </Container>
  );
}
