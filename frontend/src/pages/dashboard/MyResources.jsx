/** طلبات/مواد الطبيب مع حالة المراجعة وسبب الرفض إن وُجد. */
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Chip, Alert, Stack,
} from "@mui/material";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { LibraryAPI } from "../../api/services";
import { useFetch, asList } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { tr } from "../../utils/tr";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };
const STATUS_COLORS = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };

export default function MyResources() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => LibraryAPI.mine(), []);

  const items = asList(data);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("dashboard.myResources")} />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={2}>
          {items.map((r) => (
            <Card key={r.id} elevation={0}>
              <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                    {tr(r, "title", lang)}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" label={t(`types.${r.resource_type}`)} color={TYPE_COLORS[r.resource_type]} />
                    <Chip size="small" label={t(`status.${r.status}`)} color={STATUS_COLORS[r.status]} />
                  </Stack>
                </Box>

                {r.status === "REJECTED" && r.rejection_reason && (
                  <Alert severity="error">
                    {`${t("dashboard.rejectionReason")}: ${r.rejection_reason}`}
                  </Alert>
                )}

                {r.created_at && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
