/** الأنشطة والمؤتمرات: تصفية حسب النوع + بطاقات الفعاليات. */
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Chip, TextField, MenuItem, Stack,
} from "@mui/material";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { ContentAPI } from "../api/services";
import { useFetch, asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const CATEGORIES = ["CONFERENCE", "WORKSHOP", "SEMINAR"];

export default function Activities() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const [category, setCategory] = useState("");
  const { data, loading, error, reload } = useFetch(
    () => ContentAPI.activities(category ? { category } : undefined),
    [category]
  );
  const items = asList(data);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.activities")} title={t("activities.title")} subtitle={t("activities.subtitle")} />

      {/* تصفية حسب النوع */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <TextField select label={t("dashboard.category")} value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="">{t("common.all")}</MenuItem>
          {CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>{t(`categories.${c}`)}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {items.map((a) => (
            <Card key={a.id} elevation={0}>
              <CardActionArea component={RouterLink} to={`/activities/${a.id}`} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                <Box
                  sx={{
                    height: 140,
                    display: "flex",
                    alignItems: "flex-start",
                    p: 1.5,
                    backgroundImage: a.cover_image
                      ? `url(${a.cover_image})`
                      : (th) => `linear-gradient(135deg, ${th.palette.primary.main}, ${th.palette.primary.dark})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <Chip label={t(`categories.${a.category}`)} size="small" sx={{ bgcolor: "background.paper", fontWeight: 600 }} />
                </Box>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 0.75, width: "100%" }}>
                  <Typography variant="caption" color="primary" fontWeight={700}>
                    {new Date(a.date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.4 }}>
                    {tr(a, "title", lang)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t("activities.location")}: {tr(a, "location", lang)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
