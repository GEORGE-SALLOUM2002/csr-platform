/**
 * رسائل «تواصل معنا» (للمشرف/المدير): عرض الرسائل الواردة، تمييز المقروء،
 * الرد عبر البريد، والحذف. غير المقروءة أولاً وتُميَّز بلون بارز.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, Typography, Stack, Chip, IconButton,
  Button, Tooltip, Snackbar, Alert,
} from "@mui/material";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { ContentAPI } from "../../api/services";
import { useFetch, asList } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function ContactMessages() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirmDelete } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.contactMessages(), []);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState("");

  // غير المقروءة أولاً، ثم الأحدث
  const items = asList(data).slice().sort((a, b) => {
    if (!!a.is_read !== !!b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  const unread = items.filter((m) => !m.is_read).length;

  const markRead = async (m) => {
    setBusy(true);
    try {
      await ContentAPI.markContactRead(m.id);
      setSnack(ar("تم وضع علامة مقروءة.", "Marked as read."));
      reload();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m) => {
    if (!(await confirmDelete())) return;
    setBusy(true);
    try {
      await ContentAPI.deleteContactMessage(m.id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        eyebrow={t("nav.dashboard")}
        title={ar("رسائل التواصل", "Contact messages")}
        subtitle={
          unread
            ? ar(`لديك ${unread} رسالة غير مقروءة.`, `${unread} unread message(s).`)
            : ar("لا رسائل غير مقروءة.", "No unread messages.")
        }
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={1.5}>
          {items.map((m) => (
            <Card
              key={m.id}
              elevation={0}
              sx={{ borderColor: m.is_read ? undefined : "primary.main", borderWidth: m.is_read ? 1 : 2 }}
            >
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  alignItems={{ sm: "center" }}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 700 }}>{m.name}</Typography>
                      {!m.is_read && (
                        <Chip label={ar("جديدة", "New")} size="small" color="primary" />
                      )}
                    </Stack>
                    <Typography variant="body2" color="text.secondary" dir="ltr" sx={{ textAlign: "start" }}>
                      {m.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fmt(m.created_at)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title={ar("الرد عبر البريد", "Reply by email")}>
                      <span>
                        <Button
                          size="small"
                          startIcon={<ReplyRoundedIcon />}
                          href={`mailto:${m.email}?subject=${encodeURIComponent(
                            ar("رد على رسالتك", "Reply to your message")
                          )}`}
                        >
                          {ar("رد", "Reply")}
                        </Button>
                      </span>
                    </Tooltip>
                    {!m.is_read && (
                      <Tooltip title={ar("وضع علامة مقروءة", "Mark as read")}>
                        <span>
                          <IconButton color="primary" disabled={busy} onClick={() => markRead(m)}>
                            <MarkEmailReadRoundedIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    <Tooltip title={t("common.delete")}>
                      <span>
                        <IconButton color="error" disabled={busy} onClick={() => remove(m)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Typography
                  sx={{
                    mt: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.message}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")}>
        <Alert severity="success" onClose={() => setSnack("")} sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
    </Container>
  );
}
