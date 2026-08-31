/** مكوّنات واجهة صغيرة مشتركة: التحميل، الخطأ، الفراغ، وترويسة الصفحة. */
import { Box, CircularProgress, Alert, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export function Loader() {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
      <CircularProgress />
      <Typography color="text.secondary">{t("common.loading")}</Typography>
    </Box>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          ) : null
        }
      >
        {t("common.error")}
      </Alert>
    </Box>
  );
}

export function EmptyState({ label }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
      <Typography>{label || t("common.empty")}</Typography>
    </Box>
  );
}

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <Box sx={{ mb: 4 }}>
      {eyebrow && (
        <Typography
          sx={{ color: "primary.main", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", fontSize: ".8rem", mb: 1 }}
        >
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: subtitle ? 1 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
