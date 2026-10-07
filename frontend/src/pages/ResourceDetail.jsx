/** تفاصيل مورد علمي مع زر التنزيل. */
import { useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Chip, Button, Stack, Divider, Alert } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DOMPurify from "dompurify";
import { Loader, ErrorState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { LibraryAPI } from "../api/services";
import { useUI } from "../context/UISettingsContext";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { tr } from "../utils/tr";
import { fileKindInfo } from "../utils/fileKind";
import { useFileExists } from "../hooks/useFileExists";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };

export default function ResourceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lang } = useUI();
  const navigate = useNavigate();
  const { user, isAdmin, isEditor } = useAuth();
  const { confirm } = useConfirm();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch(() => LibraryAPI.resource(id), [id]);
  const ar = (a, e) => (lang === "ar" ? a : e);
  const fileExists = useFileExists(data?.file);

  const canDelete = !!user && (isAdmin || isEditor || user.id === data?.author);

  const remove = async () => {
    if (!(await confirm({
      message: ar("حذف هذا المحتوى نهائياً؟ لا يمكن التراجع.", "Delete this content permanently? This cannot be undone."),
      confirmText: ar("حذف", "Delete"),
      color: "error",
    }))) return;
    setBusy(true);
    try {
      await LibraryAPI.remove(id);
      navigate("/library");
    } catch (err) {
      // محذوف مسبقاً: نعود للمكتبة مباشرة
      if (err?.response?.status === 404) navigate("/library");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;
  // المحتوى حُذف من قاعدة البيانات لكنه ما زال ظاهراً في قائمة قديمة
  if (error === 404) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/library">
              {ar("العودة للمكتبة", "Back to library")}
            </Button>
          }
        >
          {ar("هذا المحتوى لم يعد متوفراً — ربما تم حذفه أو إلغاء نشره.",
              "This content is no longer available — it may have been deleted or unpublished.")}
        </Alert>
      </Container>
    );
  }
  if (error || !data) return <ErrorState onRetry={reload} />;

  const summary = tr(data, "description", lang);
  const contentHtml = tr(data, "content", lang);
  const safeContent = contentHtml ? DOMPurify.sanitize(contentHtml) : "";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button component={RouterLink} to="/library" startIcon={<ArrowBackRoundedIcon sx={{ transform: "scaleX(-1)" }} />}>
          {t("common.back")}
        </Button>
        {canDelete && (
          <Button color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} disabled={busy} onClick={remove}>
            {ar("حذف", "Delete")}
          </Button>
        )}
      </Box>

      {data.status && data.status !== "APPROVED" && (
        <Alert severity={data.status === "REJECTED" ? "error" : "warning"} sx={{ mb: 2 }}>
          {data.status === "REJECTED"
            ? ar("هذا المحتوى مرفوض وغير ظاهر للزوار في المكتبة.", "This content was rejected and is hidden from visitors.")
            : ar("هذا المحتوى بانتظار المراجعة وغير ظاهر للزوار بعد.", "This content is pending review and not yet visible to visitors.")}
          {data.status === "REJECTED" && data.rejection_reason && (
            <Box component="span" sx={{ display: "block", mt: 0.5 }}>
              {ar("سبب الرفض: ", "Reason: ")}{data.rejection_reason}
            </Box>
          )}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={t(`types.${data.resource_type}`)} color={TYPE_COLORS[data.resource_type]} />
        {data.category_name_ar && <Chip label={tr(data, "category_name", lang)} variant="outlined" />}
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {tr(data, "title", lang)}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t("common.by")} {data.author_name}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {summary && (
        <Typography sx={{ whiteSpace: "pre-line", mb: 3, fontSize: "1.05rem", color: "text.secondary" }}>
          {summary}
        </Typography>
      )}

      {contentHtml ? (
        <Box
          sx={{
            mb: 4,
            lineHeight: 1.9,
            "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, my: 2 },
            "& p": { mb: 1.5 },
            "& h2, & h3": { mt: 3, mb: 1, fontFamily: '"El Messiri", sans-serif' },
            "& ul, & ol": { pl: 3, mb: 1.5 },
            "& a": { color: "primary.main" },
          }}
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      ) : (
        !summary && <Typography sx={{ mb: 4 }}>—</Typography>
      )}

      {data.file && fileExists === false ? (
        <Alert severity="warning">
          {ar("الملف المرفق بهذا المحتوى غير متوفر حالياً — ربما تم حذفه من الخادم.",
              "The attached file is no longer available — it may have been removed from the server.")}
        </Alert>
      ) : data.file ? (() => {
        const info = fileKindInfo(data.file, lang);
        return (
          <Stack spacing={2}>
            {/* تشغيل الفيديو/الصوت مباشرة داخل الصفحة */}
            {info.kind === "video" && (
              <Box
                component="video"
                src={data.file}
                controls
                preload="metadata"
                playsInline
                sx={{ width: "100%", maxHeight: 520, borderRadius: 2, bgcolor: "#000" }}
              />
            )}
            {info.kind === "audio" && (
              <Box component="audio" src={data.file} controls preload="metadata" sx={{ width: "100%" }} />
            )}
            <Box>
              <Button variant="contained" size="large" startIcon={<DownloadRoundedIcon />} href={data.file} target="_blank" rel="noopener">
                {t("common.download")} ({info.label})
              </Button>
            </Box>
          </Stack>
        );
      })() : (
        <Typography color="text.secondary">{t("library.noFile")}</Typography>
      )}
    </Container>
  );
}
