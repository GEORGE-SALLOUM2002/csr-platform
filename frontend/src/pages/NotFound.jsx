/** صفحة 404: المسار المطلوب غير موجود. */
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Typography, Button } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import { useUI } from "../context/UISettingsContext";

export default function NotFound() {
  const { t } = useTranslation();
  const { lang } = useUI();
  return (
    <Box sx={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 2, px: 3, py: { xs: 8, md: 10 } }}>
      <Typography sx={{ fontFamily: '"El Messiri", sans-serif', fontWeight: 700, fontSize: { xs: "5rem", md: "7rem" }, lineHeight: 1, color: "primary.main" }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        {lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" size="large" startIcon={<HomeRoundedIcon />} sx={{ mt: 1 }}>
        {t("nav.home")}
      </Button>
    </Box>
  );
}
