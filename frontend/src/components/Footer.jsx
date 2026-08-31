/** تذييل الموقع. */
import { useTranslation } from "react-i18next";
import { Box, Typography, Chip } from "@mui/material";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        py: 3,
        px: 3,
        borderTop: 1,
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t("footer.rights")}
      </Typography>
      <Chip label={t("footer.prototype")} size="small" color="secondary" variant="outlined" />
    </Box>
  );
}
