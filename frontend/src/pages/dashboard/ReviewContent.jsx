/** مراجعة المحتوى: اعتماد أو رفض الموارد المرسلة قبل النشر. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Chip, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert,
} from "@mui/material";
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

  const approve = async (id) => {
    if (!(await confirm({
      message: ar("اعتماد هذا المحتوى ونشره؟", "Approve and publish this content?"),
      confirmText: t("dashboard.approve"),
      color: "success",
    }))) return;
    setBusy(true);
    try {
      await LibraryAPI.review(id, "approve");
      setSnack(true);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const openReject = (id) => {
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
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Chip label={t(`types.${item.resource_type}`)} size="small" color="primary" />
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
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button variant="contained" color="success" disabled={busy} onClick={() => approve(item.id)}>
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
