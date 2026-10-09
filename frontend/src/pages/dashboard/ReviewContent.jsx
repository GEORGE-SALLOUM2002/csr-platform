/** مراجعة المحتوى: معاينة المحتوى كاملاً ثم اعتماده أو رفضه قبل النشر. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Chip, Button, Stack, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Tabs, Tab, Pagination,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Link as RouterLink } from "react-router-dom";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DOMPurify from "dompurify";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { LibraryAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";
import { resourceFileInfo } from "../../utils/fileKind";
import ResourceFile from "../../components/ResourceFile";
import { useFileExists } from "../../hooks/useFileExists";

export default function ReviewContent() {
  const { t } = useTranslation();
  const { lang } = useUI();
  // التبويب: بانتظار المراجعة / المنشور / المرفوض — مع ترقيم الصفحات
  const [tab, setTab] = useState("PENDING");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    () => (tab === "PENDING"
      ? LibraryAPI.pending({ page })
      : LibraryAPI.resources({ status: tab, page, ordering: "-created_at" })),
    [tab, page]
  );
  const items = asList(data);
  const total = Array.isArray(data) ? data.length : data?.count || 0;
  const { confirm } = useConfirm();
  const ar = (a, e) => (lang === "ar" ? a : e);

  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(""); // رسالة النجاح
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState(null); // المورد المعروض في نافذة المعاينة
  const [actionError, setActionError] = useState("");
  const previewFileExists = useFileExists(preview?.stream_url);

  // عند فشل الاعتماد/الرفض: رسالة واضحة (خاصة إن كان المحتوى محذوفاً)
  const onActionError = (err) => {
    if (err?.response?.status === 404) {
      setActionError(ar("هذا المحتوى لم يعد موجوداً — ربما تم حذفه. تم تحديث القائمة.",
                        "This content no longer exists — it may have been deleted. The list was refreshed."));
      setPreview(null);
      setRejectId(null);
      reload();
    } else {
      setActionError(t("common.error"));
    }
  };

  // بعد أي إجراء: إن فرغت الصفحة الحالية نرجع للصفحة السابقة
  const afterAction = (msg) => {
    setPreview(null);
    setSnack(msg);
    if (items.length === 1 && page > 1) setPage((p) => p - 1);
    else reload();
  };

  const remove = async (item) => {
    if (!(await confirm({
      message: ar(`حذف «${tr(item, "title", lang)}» نهائياً مع ملفه المرفق؟ لا يمكن التراجع.`,
                  `Permanently delete "${tr(item, "title", lang)}" and its attached file? This cannot be undone.`),
      confirmText: ar("حذف", "Delete"),
      color: "error",
    }))) return;
    setBusy(true);
    try {
      await LibraryAPI.remove(item.id);
      afterAction(ar("تم حذف المحتوى نهائياً.", "Content deleted permanently."));
    } catch (err) {
      onActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const approve = async (id) => {
    if (!(await confirm({
      message: ar("اعتماد هذا المحتوى ونشره؟", "Approve and publish this content?"),
      confirmText: t("dashboard.approve"),
      color: "success",
    }))) return;
    setBusy(true);
    try {
      await LibraryAPI.review(id, "approve");
      afterAction(ar("تم اعتماد المحتوى ونشره في المكتبة.", "Content approved and published."));
    } catch (err) {
      onActionError(err);
    } finally {
      setBusy(false);
    }
  };

  const openReject = (id) => {
    setPreview(null);
    setRejectId(id);
    setReason("");
  };

  const confirmReject = async () => {
    setBusy(true);
    try {
      await LibraryAPI.review(rejectId, "reject", reason);
      setRejectId(null);
      setReason("");
      afterAction(ar("تم رفض المحتوى وإخفاؤه من المكتبة.", "Content rejected and hidden from the library."));
    } catch (err) {
      onActionError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.reviewContent")} />

      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setPage(1); }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="PENDING" label={ar("بانتظار المراجعة", "Pending")} />
        <Tab value="APPROVED" label={ar("المنشور", "Published")} />
        <Tab value="REJECTED" label={ar("المرفوض", "Rejected")} />
      </Tabs>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          label={tab === "PENDING" ? t("dashboard.noPending")
            : tab === "APPROVED" ? ar("لا يوجد محتوى منشور.", "No published content.")
            : ar("لا يوجد محتوى مرفوض.", "No rejected content.")}
        />
      ) : (
        <Stack spacing={2}>
          {items.map((item) => (
            <Card key={item.id} elevation={0}>
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                    <Chip label={t(`types.${item.resource_type}`)} size="small" color="primary" />
                    {item.file_ext && <Chip label={resourceFileInfo(item, lang).label} size="small" variant="outlined" />}
                    <Typography variant="body2" color="text.secondary">
                      {t("common.by")} {item.author_name}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    {tr(item, "title", lang)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                  </Typography>
                  {item.status === "REJECTED" && item.rejection_reason && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 0.5 }}>
                      {ar("سبب الرفض: ", "Reason: ")}{item.rejection_reason}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => setPreview(item)}>
                    {ar("معاينة", "Preview")}
                  </Button>
                  {item.status === "APPROVED" && (
                    <Button variant="outlined" startIcon={<OpenInNewRoundedIcon />} component={RouterLink} to={`/library/${item.id}`}>
                      {ar("عرض", "View")}
                    </Button>
                  )}
                  {item.status !== "APPROVED" && (
                    <Button variant="outlined" color="success" disabled={busy} onClick={() => approve(item.id)}>
                      {item.status === "REJECTED" ? ar("إعادة النشر", "Republish") : t("dashboard.approve")}
                    </Button>
                  )}
                  {item.status !== "REJECTED" && (
                    <Button variant="outlined" color="warning" disabled={busy} onClick={() => openReject(item.id)}>
                      {item.status === "APPROVED" ? ar("إلغاء النشر", "Unpublish") : t("dashboard.reject")}
                    </Button>
                  )}
                  <Button variant="outlined" color="error" startIcon={<DeleteRoundedIcon />} disabled={busy} onClick={() => remove(item)}>
                    {ar("حذف", "Delete")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {total > 12 && (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
              <Pagination count={Math.ceil(total / 12)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Stack>
      )}

      {/* نافذة معاينة المحتوى كاملاً */}
      <Dialog open={preview !== null} onClose={() => setPreview(null)} fullWidth maxWidth="md" scroll="paper">
        {preview && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              {tr(preview, "title", lang)}
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap>
                <Chip size="small" color="primary" label={t(`types.${preview.resource_type}`)} />
                {preview.category_name_ar && <Chip size="small" variant="outlined" label={tr(preview, "category_name", lang)} />}
                <Chip size="small" variant="outlined" label={`${t("common.by")} ${preview.author_name}`} />
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              {!preview.description_ar && !preview.description_en && !preview.content_ar && !preview.content_en && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {ar("لم يُدرِج الكاتب وصفاً أو نصّاً لهذا المورد — يعتمد على الملف المرفق فقط (إن وُجد).",
                      "The author added no summary or body text — this resource relies on its attached file only (if any).")}
                </Alert>
              )}
              <ContentBlock label={ar("العنوان (عربي)", "Title (Arabic)")} value={preview.title_ar} />
              <ContentBlock label={ar("العنوان (إنجليزي)", "Title (English)")} value={preview.title_en} />
              <ContentBlock label={ar("الوصف المختصر (عربي)", "Summary (Arabic)")} value={preview.description_ar} pre />
              <ContentBlock label={ar("الوصف المختصر (إنجليزي)", "Summary (English)")} value={preview.description_en} pre />
              <RichBlock label={ar("المحتوى (عربي)", "Content (Arabic)")} html={preview.content_ar} />
              <RichBlock label={ar("المحتوى (إنجليزي)", "Content (English)")} html={preview.content_en} />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {ar("الملف المرفق", "Attached file")}
              </Typography>
              {preview.stream_url && previewFileExists === false ? (
                <Alert severity="warning">
                  {ar("الملف المرفق غير متوفر على الخادم — ربما تم حذفه.",
                      "The attached file is not available on the server — it may have been deleted.")}
                </Alert>
              ) : preview.stream_url ? (
                // معاينة داخل الصفحة فقط — التحميل ممنوع للجميع
                <ResourceFile resource={preview} lang={lang} />
              ) : (
                <Typography color="text.secondary">{t("library.noFile")}</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
              <Button onClick={() => setPreview(null)}>{t("common.close")}</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button color="error" startIcon={<DeleteRoundedIcon />} disabled={busy} onClick={() => remove(preview)}>
                {ar("حذف", "Delete")}
              </Button>
              {preview.status !== "REJECTED" && (
                <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} disabled={busy} onClick={() => openReject(preview.id)}>
                  {preview.status === "APPROVED" ? ar("إلغاء النشر", "Unpublish") : t("dashboard.reject")}
                </Button>
              )}
              {preview.status !== "APPROVED" && (
                <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} disabled={busy} onClick={() => approve(preview.id)}>
                  {preview.status === "REJECTED" ? ar("إعادة النشر", "Republish") : t("dashboard.approve")}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* نافذة سبب الرفض */}
      <Dialog open={rejectId !== null} onClose={() => setRejectId(null)} fullWidth maxWidth="sm">
        <DialogTitle>{t("dashboard.rejectReason")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            margin="dense"
            label={t("dashboard.rejectReason")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectId(null)}>{t("common.cancel")}</Button>
          <Button color="error" variant="contained" disabled={busy} onClick={confirmReject}>
            {t("dashboard.reject")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack("")}>
        <Alert severity="success" onClose={() => setSnack("")} sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
      <Snackbar open={!!actionError} autoHideDuration={5000} onClose={() => setActionError("")}>
        <Alert severity="warning" onClose={() => setActionError("")} sx={{ width: "100%" }}>
          {actionError}
        </Alert>
      </Snackbar>
    </Container>
  );
}

/** كتلة نصية بسيطة (عنوان/وصف) — تُخفى إن كانت فارغة. */
function ContentBlock({ label, value, pre = false }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ whiteSpace: pre ? "pre-line" : "normal" }}>{value}</Typography>
    </Box>
  );
}

/** كتلة محتوى غنيّ (HTML) — تُعقَّم قبل العرض، وتُخفى إن كانت فارغة. */
function RichBlock({ label, html }) {
  if (!html) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>{label}</Typography>
      <Box
        sx={{
          lineHeight: 1.9,
          "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, my: 1 },
          "& p": { mb: 1 },
          "& h2, & h3": { mt: 2, mb: 0.5 },
          "& ul, & ol": { pl: 3, mb: 1 },
          "& a": { color: "primary.main" },
        }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </Box>
  );
}
