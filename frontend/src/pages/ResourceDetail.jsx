/** تفاصيل مورد علمي — الملفات تُعرض داخل الصفحة فقط (التحميل ممنوع). */
import { useState } from "react";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Chip, Button, Stack, Divider, Alert } from "@mui/material";
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
import { useFileExists } from "../hooks/useFileExists";
import VideoPlayer from "../components/VideoPlayer";
import ResourceFile from "../components/ResourceFile";

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
  const fileExists = useFileExists(data?.stream_url);

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
        !summary && !data.video_url && !data.stream_url && <Typography sx={{ mb: 4 }}>—</Typography>
      )}

      {/* فيديو برابط خارجي (YouTube / Microsoft) يُعرض داخل الموقع */}
      {data.video_url && (
        <Box sx={{ mb: 3 }}>
          <VideoPlayer
            resourceId={data.id}
            videoUrl={data.video_url}
            views={data.view_count}
            clicks={data.click_count}
            lang={lang}
          />
        </Box>
      )}

      {data.stream_url && fileExists === false ? (
        <Alert severity="warning">
          {ar("الملف المرفق بهذا المحتوى غير متوفر حالياً — ربما تم حذفه من الخادم.",
              "The attached file is no longer available — it may have been removed from the server.")}
        </Alert>
      ) : data.stream_url ? (
        // عرض داخل الموقع فقط — لا يوجد زر تحميل
        <ResourceFile resource={data} lang={lang} views={data.video_url ? null : data.view_count} />
      ) : (
        !data.video_url && <Typography color="text.secondary">{t("library.noFile")}</Typography>
      )}
    </Container>
  );
}
