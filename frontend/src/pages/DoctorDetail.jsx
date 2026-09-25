/** تفاصيل طبيب: بياناته الشخصية ونبذته وأبحاثه المنشورة. */
import { useParams, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Typography, Chip, Button, Stack, Divider, Avatar, Card, CardActionArea,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Loader, ErrorState, EmptyState } from "../components/ui";
import { useFetch } from "../hooks/useFetch";
import { DoctorsAPI } from "../api/services";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };

export default function DoctorDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => DoctorsAPI.get(id), [id]);

  if (loading) return <Loader />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  const research = data.research || [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Button component={RouterLink} to="/doctors" startIcon={<ArrowBackRoundedIcon sx={{ transform: "scaleX(-1)" }} />} sx={{ mb: 3 }}>
        {t("common.back")}
      </Button>

      {/* الترويسة: الصورة والاسم والاختصاص */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "center", sm: "flex-start" }, gap: 3, textAlign: { xs: "center", sm: "start" } }}>
        <Avatar src={data.photo || "/logo.svg"} sx={{ width: 120, height: 120, bgcolor: "primary.main", fontSize: "3rem" }}>
          {data.full_name?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {data.full_name}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight={600}>
            {tr(data, "specialty", lang)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* بيانات معنونة */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <InfoRow label={t("doctors.specialty")} value={tr(data, "specialty", lang)} />
        <InfoRow label={t("doctors.degree")} value={tr(data, "degree", lang)} />
        <InfoRow label={t("doctors.workplace")} value={tr(data, "workplace", lang)} />
      </Stack>

      {tr(data, "bio", lang) && (
        <Typography color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 4 }}>
          {tr(data, "bio", lang)}
        </Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* الأبحاث المنشورة */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {t("doctors.research")}
      </Typography>

      {research.length === 0 ? (
        <EmptyState label={t("doctors.noResearch")} />
      ) : (
        <Stack spacing={1.5}>
          {research.map((r) => (
            <Card key={r.id} elevation={0}>
              <CardActionArea component={RouterLink} to={`/library/${r.id}`} sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
                <Typography fontWeight={600}>{tr(r, "title", lang)}</Typography>
                <Chip label={t(`types.${r.type}`)} color={TYPE_COLORS[r.type] || "default"} size="small" />
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Typography sx={{ fontWeight: 700, minWidth: 120 }}>{label}:</Typography>
      <Typography color="text.secondary">{value}</Typography>
    </Box>
  );
}
