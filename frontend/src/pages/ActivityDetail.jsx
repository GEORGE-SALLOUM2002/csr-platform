/** تفاصيل نشاط/مؤتمر: الوصف والفيديو والملفات العلمية. */
import { useParams, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Chip, Button, Stack, Divider } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { Loader, ErrorState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { ContentAPI } from "../api/services";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function ActivityDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.activity(id), [id]);

  if (loading) return <Loader />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const files = data.files || [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button component={RouterLink} to="/activities" startIcon={<ArrowBackRoundedIcon sx={{ transform: "scaleX(-1)" }} />} sx={{ mb: 3 }}>
        {t("common.back")}
      </Button>

      {data.cover_image && (
        <Box
          component="img"
          src={data.cover_image}
          alt={tr(data, "title", lang)}
          sx={{ width: "100%", maxHeight: 340, objectFit: "cover", borderRadius: 3, mb: 3 }}
        />
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={t(`categories.${data.category}`)} color="primary" />
        <Chip icon={<EventRoundedIcon />} label={new Date(data.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")} variant="outlined" />
        {tr(data, "location", lang) && (
          <Chip icon={<LocationOnRoundedIcon />} label={tr(data, "location", lang)} variant="outlined" />
        )}
      </Stack>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        {tr(data, "title", lang)}
      </Typography>

      <Typography sx={{ whiteSpace: "pre-line", mb: 4 }}>
        {tr(data, "description", lang) || "—"}
      </Typography>

      {data.video_url && (
        <Button variant="contained" startIcon={<PlayCircleRoundedIcon />} href={data.video_url} target="_blank" rel="noopener" sx={{ mb: 4 }}>
          {t("activities.watchVideo")}
        </Button>
      )}

      {files.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {t("activities.files")}
          </Typography>
          <Stack spacing={1.5}>
            {files.map((f) => (
              <Button
                key={f.id}
                variant="outlined"
                startIcon={<DownloadRoundedIcon />}
                href={f.file}
                target="_blank"
                rel="noopener"
                sx={{ justifyContent: "flex-start" }}
              >
                {tr(f, "title", lang)}
              </Button>
            ))}
          </Stack>
        </>
      )}
    </Container>
  );
}
