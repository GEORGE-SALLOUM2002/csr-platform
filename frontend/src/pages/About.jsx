/** من نحن: نبذة عن الجمعية ورسالتها مع رسم بصري. */
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Stack } from "@mui/material";
import { PageHeader } from "../components/ui";
import ScanVisual from "../components/ScanVisual";
import { useUI } from "../context/UISettingsContext";

export default function About() {
  const { t } = useTranslation();
  const { lang } = useUI();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.about")} title={t("home.aboutTitle")} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Stack spacing={2.5}>
          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {t("home.aboutText")}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "تعمل الجمعية على تطوير الممارسة العلمية في مجال الأشعة عبر تبنّي أحدث المعايير الطبية، ودعم الأطباء المنتسبين بالمصادر والمراجع، وتوفير بيئةٍ مهنية تُعزّز التعلّم المستمر وتبادل الخبرات بين الزملاء."
              : "The association advances scientific practice in radiology by adopting the latest medical standards, supporting affiliated physicians with resources and references, and fostering a professional environment that encourages continuous learning and the exchange of expertise among colleagues."}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "كما تنظّم المؤتمرات والندوات وورش العمل العلمية، وتُعنى بنشر الوعي الصحي بين المرضى بلغةٍ مبسّطة وموثوقة، إيماناً منها بأنّ المعرفة الطبية رسالةٌ تُخدَم بها المهنة والمجتمع معاً."
              : "It also organizes scientific conferences, seminars, and workshops, and is committed to spreading health awareness among patients in clear and trustworthy language, in the belief that medical knowledge is a mission that serves both the profession and the community."}
          </Typography>
        </Stack>
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <ScanVisual />
        </Box>
      </Box>
    </Container>
  );
}
