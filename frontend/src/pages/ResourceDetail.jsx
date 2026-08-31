/** تفاصيل مورد علمي مع زر التنزيل. */
import { useParams, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Chip, Button, Stack, Divider } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DOMPurify from "dompurify";
import { Loader, ErrorState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { LibraryAPI } from "../api/services";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };

export default function ResourceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => LibraryAPI.resource(id), [id]);

  if (loading) return <Loader />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const summary = tr(data, "description", lang);
  const contentHtml = tr(data, "content", lang);
  const safeContent = contentHtml ? DOMPurify.sanitize(contentHtml) : "";

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button component={RouterLink} to="/library" startIcon={<ArrowBackRoundedIcon sx={{ transform: "scaleX(-1)" }} />} sx={{ mb: 3 }}>
        {t("common.back")}
      </Button>

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

      {data.file ? (
        <Button variant="contained" size="large" startIcon={<DownloadRoundedIcon />} href={data.file} target="_blank" rel="noopener">
          {t("common.download")} ({t("common.pdf")})
        </Button>
      ) : (
        <Typography color="text.secondary">{t("library.noFile")}</Typography>
      )}
    </Container>
  );
}
