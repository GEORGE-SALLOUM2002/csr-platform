/** مراجعة المحتوى: معاينة المحتوى كاملاً ثم اعتماده أو رفضه قبل النشر. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Chip, Button, Stack, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DOMPurify from "dompurify";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { useFetch, asList } from "../../hooks/useFetch";
import { LibraryAPI } from "../../api/services";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

export default function ReviewContent() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => LibraryAPI.pending(), []);
  const items = asList(data);
  const { confirm } = useConfirm();
  const ar = (a, e) => (lang === "ar" ? a : e);

  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState(null); // المورد المعروض في نافذة المعاينة

  const approve = async (id) => {
    if (!(await confirm({
      message: ar("اعتماد هذا المحتوى ونشره؟", "Approve and publish this content?"),
      confirmText: t("dashboard.approve"),
      color: "success",
    }))) return;
    setBusy(true);
    try {
      await LibraryAPI.review(id, "approve");
      setPreview(null);
      setSnack(true);
      reload();
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
      setSnack(true);
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.reviewContent")} />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState label={t("dashboard.noPending")} />
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
                    {item.file && <Chip label={t("common.pdf")} size="small" variant="outlined" />}
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
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => setPreview(item)}>
                    {ar("معاينة", "Preview")}
                  </Button>
                  <Button variant="outlined" color="success" disabled={busy} onClick={() => approve(item.id)}>
                    {t("dashboard.approve")}
                  </Button>
                  <Button variant="outlined" color="error" disabled={busy} onClick={() => openReject(item.id)}>
                    {t("dashboard.reject")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
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
              {preview.file ? (
                <Stack spacing={1.5}>
                  <Box
                    component="iframe"
                    src={preview.file}
                    title={ar("معاينة ملف PDF", "PDF preview")}
                    sx={{
                      width: "100%",
                      height: { xs: 360, md: 560 },
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      bgcolor: "#fff",
                    }}
                  />
                  <Box>
                    <Button variant="outlined" startIcon={<DownloadRoundedIcon />} href={preview.file} target="_blank" rel="noopener">
                      {ar("فتح الملف في تبويب جديد", "Open file in a new tab")}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {ar("إن لم تظهر المعاينة أعلاه (أثناء التطوير المحلّي)، افتح الملف في تبويب جديد لمراجعته.",
                          "If the preview above doesn't load (in local development), open the file in a new tab to review it.")}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography color="text.secondary">{t("library.noFile")}</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: "wrap" }}>
              <Button onClick={() => setPreview(null)}>{t("common.close")}</Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} disabled={busy} onClick={() => openReject(preview.id)}>
                {t("dashboard.reject")}
              </Button>
              <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} disabled={busy} onClick={() => approve(preview.id)}>
                {t("dashboard.approve")}
              </Button>
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

      <Snackbar open={snack} autoHideDuration={3000} onClose={() => setSnack(false)}>
        <Alert severity="success" onClose={() => setSnack(false)} sx={{ width: "100%" }}>
          {t("common.saved")}
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
