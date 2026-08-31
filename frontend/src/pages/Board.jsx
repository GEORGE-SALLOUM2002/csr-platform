/** مجلس الإدارة: بطاقات أعضاء المجلس. */
import { useTranslation } from "react-i18next";
import { Container, Box, Card, CardContent, Typography, Chip, Avatar } from "@mui/material";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { ContentAPI } from "../api/services";
import { useFetch, asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function Board() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.board(), []);
  const items = asList(data);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.board")} title={t("board.title")} subtitle={t("board.subtitle")} />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2.5 }}>
          {items.map((m) => (
            <Card key={m.id} elevation={0}>
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1.25 }}>
                <Avatar src={m.photo || undefined} sx={{ width: 72, height: 72, bgcolor: "primary.main", fontSize: "1.8rem" }}>
                  {tr(m, "name", lang).charAt(0)}
                </Avatar>
                <Chip label={tr(m, "role", lang)} color="primary" variant="outlined" size="small" />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {tr(m, "name", lang)}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
