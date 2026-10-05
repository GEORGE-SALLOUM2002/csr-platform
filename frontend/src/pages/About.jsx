/** من نحن: نبذة عن الجمعية ورسالتها مع شعار الجمعية. */
import { useTranslation } from "react-i18next";
import { Container, Box, Typography, Stack } from "@mui/material";
import { PageHeader } from "../components/ui";
import { useUI } from "../context/UISettingsContext";

export default function About() {
  const { t } = useTranslation();
  const { lang } = useUI();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("home.aboutTitle")} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: { xs: 4, md: 6 }, alignItems: "center" }}>
        <Stack spacing={2.5}>
          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {t("home.aboutText")}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.02rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "الجمعية غير ربحية، وتعتمد على العمل التطوعي لأعضائها، وهي حاليا قيد التسجيل  رسمياً لدى الجهات المختصة في سوريا."
              : "The association advances scientific practice in radiology by adopting the latest medical standards, supporting affiliated physicians with resources and references, and fostering a professional environment that encourages continuous learning and the exchange of expertise among colleagues."}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "تتمثل أهداف الجمعية في دعم التعليم والتدريب المهني لأطباء الأشعة والفنيين العاملين في مجالات الأشعة التشخيصية والتداخلية والطب النووي. وتقتصر أنشطتها على المجالين العلمي والمهني."
              : "The Community’s objectives are to support education and professional training for radiologists and technologists working in diagnostic radiology, interventional radiology, and nuclear medicine. Its activities are exclusively scientific and professional."}
          </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "تأتي أنشطة الجمعية دعمًا للعملية التعليمية والتدريبية التي ترعاها المؤسسات الحكومية المحلية، ولا تُعدّ بديلاً عنها."
              : "The Community’s activities complement the education and training provided by local government institutions and do not replace them."}
          </Typography>          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "تسعى الجمعية إلى أن تكون مجتمعاً مهنياً يجمع الزميلات والزملاء في اختصاص الأشعة، سواء الراغبين في المساهمة بجهودهم التطوعية أو الاستفادة من أنشطتها."
              : "The Community aims to build a professional community that welcomes colleagues in radiology who wish to volunteer their expertise or benefit from its activities."}
          </Typography>          <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "سيُفتح باب الانتساب إلى الجمعية بعد استكمال إجراءات التسجيل الرسمي، وسيعلن عن ذلك عبر موقعها الإلكتروني."
              : "Membership will open once the formal registration process is complete. An announcement will be published on the Community’s website."}
          </Typography>
                    <Typography color="text.secondary" sx={{ fontSize: "1.05rem", lineHeight: 1.9 }}>
            {lang === "ar"
              ? "إدارة جمعية أطباء الأشعة السوريين"
              : "The Board of the Community of syrian Radiologists."}
          </Typography>
        </Stack>
        {/* شعار الجمعية (نفس شعار الصفحة الرئيسية) */}
        <Box sx={{ display: "grid", placeItems: "center" }}>
          <Box sx={{ bgcolor: "#f8f8f8", borderRadius: 4, p: { xs: 2.5, md: 3.5 }, boxShadow: 6, maxWidth: "100%" }}>
            <Box
              component="img"
              src="/logo-csr.jpg"
              alt={t("brand.name")}
              sx={{ width: { xs: 260, md: 360 }, maxWidth: "100%", height: "auto", display: "block" }}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
