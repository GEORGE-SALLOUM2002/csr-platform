/**
 * الصفحة الرئيسية — الترتيب:
 *  1) الواجهة (Hero) + الإحصاءات
 *  2) وصول سريع للأقسام
 *  3) أحدث الإعلانات والمؤتمرات
 *  4) روزنامة الأنشطة والمؤتمرات
 *  5) آخر الأخبار + نبذة عن الجمعية
 *  6) روابط التواصل الاجتماعي
 * التصميم مبني للموبايل أولاً ثم يتوسّع للشاشات الكبيرة.
 */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Container, Typography, Button, Card, CardActionArea, Stack,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FeaturedBanner from "../components/FeaturedBanner";
import EventsCalendar from "../components/EventsCalendar";
import SocialLinks from "../components/SocialLinks";
import { ContentAPI, LibraryAPI } from "../api/services";
import client from "../api/client";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

// روابط التواصل الافتراضية للجمعية (تُستخدم إن لم تُضبط من لوحة التحكم)
const SOCIAL = {
  facebook: "https://www.facebook.com/csradiologists",
  instagram: "https://www.instagram.com/p/DcBOwxxFOYq/",
  email: "Admin@scradiology.com",
};

// بطاقات الوصول السريع (غيّر ترتيب الأسطر لتغيير ترتيب البطاقات)
const quickCards = [
  { to: "/library", key: "library", icon: <MenuBookRoundedIcon /> },
  { to: "/doctors", key: "doctors", icon: <GroupsRoundedIcon /> },
  { to: "/activities", key: "activities", icon: <EventRoundedIcon /> },
  { to: "/news", key: "news", icon: <CampaignRoundedIcon /> },
  { to: "/patients", key: "patients", icon: <HealthAndSafetyRoundedIcon /> },
  { to: "/contact", key: "contact", icon: <MailRoundedIcon /> },
];

export default function Home() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const isAr = lang === "ar";
  const locale = isAr ? "ar-EG" : "en-GB";
  // اتجاه سهم «اذهب» حسب اللغة
  const arrowSx = { fontSize: 18, transform: isAr ? "none" : "scaleX(-1)" };

  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ doctors: null, resources: null, activities: null });
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    ContentAPI.news().then((r) => setNews(asList(r.data).slice(0, 4))).catch(() => {});
    ContentAPI.siteSettings().then((r) => setSettings(r.data)).catch(() => {});
    Promise.all([
      client.get("/doctors/"),
      LibraryAPI.resources({ status: "APPROVED" }), // المنشور فقط (حتى للمدير)
      ContentAPI.activities(),
    ])
      .then(([d, r, a]) => {
        const count = (res) => (res.data?.count ?? asList(res.data).length);
        setStats({ doctors: count(d), resources: count(r), activities: count(a) });
      })
      .catch(() => {});
  }, []);

  return (
    <Box>
      {/* ---------- 1) الواجهة الرئيسية (Hero) ---------- */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          background: (th) =>
            `linear-gradient(180deg, ${th.palette.primary.main}14 0%, transparent 100%)`,
          "&::before": {
            content: '""',
            position: "absolute",
            insetInlineEnd: { xs: -160, md: -120 },
            top: { xs: -180, md: -140 },
            width: { xs: 380, md: 520 },
            height: { xs: 380, md: 520 },
            borderRadius: "50%",
            background: (th) => `radial-gradient(circle, ${th.palette.primary.main}22, transparent 68%)`,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, position: "relative" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
              gap: { xs: 3, md: 8 },
              alignItems: "center",
            }}
          >
            {/* النص */}
            <Box sx={{ textAlign: { xs: "center", md: "start" }, order: { xs: 2, md: 1 } }}>
              <Typography
                variant="h2"
                sx={{ fontWeight: 700, fontSize: { xs: "1.75rem", sm: "2.2rem", md: "3rem" }, lineHeight: 1.2, mb: 1.5 }}
              >
                {t("home.heroTitle")}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: "0.98rem", md: "1.1rem" }, lineHeight: 1.8, mb: 3, maxWidth: 540, mx: { xs: "auto", md: 0 } }}
              >
                {t("home.heroLead")}
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                justifyContent={{ xs: "center", md: "flex-start" }}
              >
                <Button
                  component={RouterLink}
                  to="/library"
                  variant="contained"
                  size="large"
                  startIcon={<MenuBookRoundedIcon />}
                  sx={{ borderRadius: 5, px: 3, py: 1.2, fontWeight: 700, boxShadow: 3 }}
                >
                  {t("home.browseLibrary")}
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  size="large"
                  startIcon={<GroupsRoundedIcon />}
                  sx={{ borderRadius: 5, px: 3, py: 1.2, fontWeight: 700, borderWidth: 2, "&:hover": { borderWidth: 2 } }}
                >
                  {t("home.joinDoctor")}
                </Button>
              </Stack>

              {/* إحصاءات حيّة */}
              <Box
                sx={{
                  mt: { xs: 3, md: 4 },
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: { xs: 1, sm: 2 },
                  maxWidth: 520,
                  mx: { xs: "auto", md: 0 },
                }}
              >
                <StatTile value={stats.doctors} label={t("home.statsPhysicians")} />
                <StatTile value={stats.resources} label={t("home.statsResources")} />
                <StatTile value={stats.activities} label={t("home.statsEvents")} />
              </Box>
            </Box>

            {/* الشعار */}
            <Box sx={{ display: "grid", placeItems: "center", order: { xs: 1, md: 2 } }}>
              <Box
                sx={{
                  position: "relative",
                  display: "grid",
                  placeItems: "center",
                  // هالة دائرية خفيفة خلف الشعار
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: { xs: -14, md: -28 },
                    borderRadius: "50%",
                    border: 2,
                    borderColor: (th) => `${th.palette.primary.main}33`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 150, sm: 190, md: 300 },
                    height: { xs: 150, sm: 190, md: 300 },
                    borderRadius: "50%",
                    bgcolor: "#f8f8f8", // نفس لون خلفية صورة الشعار حتى لا يظهر مربّع حولها
                    display: "grid",
                    placeItems: "center",
                    border: 1,
                    borderColor: "divider",
                    boxShadow: (th) => `0 12px 40px ${th.palette.primary.main}33`,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    component="img"
                    src="/logo-csr.jpg"
                    alt={t("brand.name")}
                    sx={{ width: "92%", height: "auto", display: "block" }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ---------- 2) وصول سريع ---------- */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <SectionTitle>{t("home.quickTitle")}</SectionTitle>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 1.5, md: 2.5 },
          }}
        >
          {quickCards.map((c) => (
            <Card
              key={c.to}
              elevation={0}
              sx={{
                borderRadius: 3,
                transition: "transform .2s, box-shadow .2s",
                "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={c.to}
                sx={{
                  height: "100%",
                  p: { xs: 2, md: 2.5 },
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  alignItems: "center",
                  justifyContent: { xs: "center", md: "flex-start" },
                  gap: { xs: 1, md: 2 },
                  textAlign: { xs: "center", md: "start" },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 48, md: 56 },
                    height: { xs: 48, md: 56 },
                    flexShrink: 0,
                    borderRadius: "50%",
                    bgcolor: (th) => `${th.palette.primary.main}1A`,
                    color: "primary.main",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {c.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: { xs: ".9rem", md: "1.1rem" }, lineHeight: 1.3 }}>
                    {t(`nav.${c.key}`)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, mt: 0.5 }}
                  >
                    {t("common.goToSection")} <ArrowBackRoundedIcon sx={arrowSx} />
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>

      {/* ---------- 3) أحدث الإعلانات والمؤتمرات ---------- */}
      <FeaturedBanner />

      {/* ---------- 4) روزنامة الأنشطة والمؤتمرات ---------- */}
      <EventsCalendar />

      {/* ---------- 5) آخر الأخبار + نبذة ---------- */}
      <Box sx={{ bgcolor: "action.hover", mt: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: { xs: 4, md: 5 } }}>
            {/* آخر الأخبار */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <SectionTitle sx={{ mb: 0 }}>{t("home.latestNews")}</SectionTitle>
                <Button
                  component={RouterLink}
                  to="/news"
                  size="small"
                  endIcon={<ArrowBackRoundedIcon sx={arrowSx} />}
                  sx={{ fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {t("common.viewAll")}
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {news.length === 0 && (
                  <Typography color="text.secondary">{t("common.empty")}</Typography>
                )}
                {news.map((n) => {
                  const d = new Date(n.publish_at);
                  return (
                    <Card key={n.id} elevation={0} sx={{ borderRadius: 3 }}>
                      <CardActionArea
                        component={RouterLink}
                        to="/news"
                        sx={{ p: { xs: 1.5, md: 2 }, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-start" }}
                      >
                        {/* شارة التاريخ */}
                        <Box
                          sx={{
                            flexShrink: 0,
                            width: 56,
                            py: 0.75,
                            borderRadius: 2,
                            bgcolor: "primary.main",
                            color: "primary.contrastText",
                            textAlign: "center",
                            lineHeight: 1.1,
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.1 }}>
                            {d.toLocaleDateString(locale, { day: "numeric" })}
                          </Typography>
                          <Typography sx={{ fontSize: ".7rem", opacity: 0.9 }}>
                            {d.toLocaleDateString(locale, { month: "short" })}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: ".92rem", md: "1rem" },
                            lineHeight: 1.5,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {tr(n, "title", lang)}
                        </Typography>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Stack>
            </Box>

            {/* نبذة عن الجمعية */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 4,
                p: { xs: 3, md: 4 },
                alignSelf: "start",
                color: "#fff",
                background: (th) =>
                  `linear-gradient(135deg, ${th.palette.primary.dark}, ${th.palette.primary.main})`,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: "1.25rem", md: "1.5rem" } }}>
                {t("home.aboutTitle")}
              </Typography>
              <Typography sx={{ mb: 3, opacity: 0.92, lineHeight: 1.8, fontSize: { xs: ".95rem", md: "1rem" } }}>
                {t("home.aboutText")}
              </Typography>
              <Button
                component={RouterLink}
                to="/about"
                variant="contained"
                endIcon={<ArrowBackRoundedIcon sx={arrowSx} />}
                sx={{ bgcolor: "#fff", color: "primary.dark", fontWeight: 700, borderRadius: 5, "&:hover": { bgcolor: "#f1f1f1" } }}
              >
                {t("nav.about")}
              </Button>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* ---------- 6) روابط التواصل الاجتماعي (أسفل الصفحة) ---------- */}
      <Box sx={{ borderTop: 1, borderColor: "divider", bgcolor: "action.hover" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: "1rem", md: "1.1rem" } }}>
              {isAr ? "تابعونا على منصّات التواصل الاجتماعي" : "Follow us on social media"}
            </Typography>
            <SocialLinks
              justify="center"
              size="large"
              data={{
                facebook: settings?.facebook || SOCIAL.facebook,
                instagram: settings?.instagram || SOCIAL.instagram,
                email: settings?.contact_email || SOCIAL.email,
              }}
            />
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

/** عنوان قسم موحّد مع خط ملوّن صغير تحته. */
function SectionTitle({ children, sx }) {
  return (
    <Box sx={{ mb: { xs: 2, md: 3 }, ...sx }}>
      <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: "1.3rem", md: "1.75rem" } }}>
        {children}
      </Typography>
      <Box sx={{ mt: 0.75, width: 48, height: 4, borderRadius: 2, bgcolor: "primary.main" }} />
    </Box>
  );
}

/** مربّع إحصاءة صغير (عدد + وصف). */
function StatTile({ value, label }) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        py: { xs: 1.25, md: 1.5 },
        px: 1,
        textAlign: "center",
      }}
    >
      <Typography
        sx={{
          fontFamily: '"El Messiri", sans-serif',
          fontWeight: 700,
          fontSize: { xs: "1.35rem", md: "1.7rem" },
          lineHeight: 1.1,
          color: "primary.main",
        }}
      >
        {value == null ? "—" : `+${value}`}
      </Typography>
      <Typography sx={{ fontSize: { xs: ".7rem", md: ".8rem" }, color: "text.secondary", lineHeight: 1.3, mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}
