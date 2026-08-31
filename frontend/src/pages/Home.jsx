/** الصفحة الرئيسية: واجهة تعريفية + وصول سريع + إحصاءات حيّة + آخر الأخبار. */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Container, Typography, Button, Card, CardActionArea, CardContent, Divider, Stack,
} from "@mui/material";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ScanVisual from "../components/ScanVisual";
import FeaturedBanner from "../components/FeaturedBanner";
import { ContentAPI, LibraryAPI } from "../api/services";
import client from "../api/client";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

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
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState({ doctors: null, resources: null, activities: null });

  useEffect(() => {
    ContentAPI.news().then((r) => setNews(asList(r.data).slice(0, 4))).catch(() => {});
    Promise.all([
      client.get("/doctors/"),
      LibraryAPI.resources(),
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
      {/* ---------- الواجهة الرئيسية (Hero) ---------- */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            insetInlineEnd: -120,
            top: -140,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: (th) => `radial-gradient(circle, ${th.palette.primary.main}22, transparent 68%)`,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 }, position: "relative" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" }, gap: { xs: 4, md: 8 }, alignItems: "center" }}>
            <Box>
              <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", fontSize: ".82rem", mb: 2 }}>
                {t("home.eyebrow")}
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: "2.1rem", md: "3rem" }, lineHeight: 1.15, mb: 2 }}>
                {t("home.heroTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.1rem", mb: 3, maxWidth: 540 }}>
                {t("home.heroLead")}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button component={RouterLink} to="/library" variant="contained" size="large" startIcon={<MenuBookRoundedIcon />}>
                  {t("home.browseLibrary")}
                </Button>
                <Button component={RouterLink} to="/register" variant="outlined" size="large" startIcon={<GroupsRoundedIcon />}>
                  {t("home.joinDoctor")}
                </Button>
              </Stack>

              {/* إحصاءات حيّة */}
              <Stack direction="row" spacing={4} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "divider" }} flexWrap="wrap" useFlexGap>
                <StatMini value={stats.doctors} label={t("home.statsPhysicians")} />
                <StatMini value={stats.resources} label={t("home.statsResources")} />
                <StatMini value={stats.activities} label={t("home.statsEvents")} />
              </Stack>
            </Box>
            <Box sx={{ display: "grid", placeItems: "center" }}>
              <ScanVisual />
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ---------- شريط الإعلانات والمؤتمرات ---------- */}
      <FeaturedBanner />

      {/* ---------- وصول سريع ---------- */}
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {t("home.quickTitle")}
        </Typography>
        <Divider sx={{ mb: 3, width: 60, borderBottomWidth: 3, borderColor: "primary.main" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {quickCards.map((c) => (
            <Card key={c.to} elevation={0}>
              <CardActionArea component={RouterLink} to={c.to} sx={{ p: 1, height: "100%" }}>
                <CardContent>
                  <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: "action.hover", color: "primary.main", display: "grid", placeItems: "center", mb: 1.5 }}>
                    {c.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {t(`nav.${c.key}`)}
                  </Typography>
                  <Typography variant="body2" color="primary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {t("common.goToSection")} <ArrowBackRoundedIcon sx={{ fontSize: 16, transform: "scaleX(-1)" }} />
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Container>

      {/* ---------- آخر الأخبار + نبذة ---------- */}
      <Box sx={{ bgcolor: "action.hover" }}>
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: 5 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {t("home.latestNews")}
              </Typography>
              <Stack spacing={1.5}>
                {news.length === 0 && (
                  <Typography color="text.secondary">{t("common.empty")}</Typography>
                )}
                {news.map((n) => (
                  <Card key={n.id} elevation={0}>
                    <CardActionArea component={RouterLink} to="/news" sx={{ p: 2 }}>
                      <Typography variant="caption" color="primary" fontWeight={700}>
                        {new Date(n.publish_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
                      </Typography>
                      <Typography fontWeight={600}>{tr(n, "title", lang)}</Typography>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                {t("home.aboutTitle")}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {t("home.aboutText")}
              </Typography>
              <Button component={RouterLink} to="/about" variant="outlined">
                {t("nav.about")}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

function StatMini({ value, label }) {
  return (
    <Box>
      <Typography sx={{ fontFamily: '"El Messiri", sans-serif', fontWeight: 700, fontSize: "1.7rem", lineHeight: 1 }}>
        {value == null ? "—" : `+${value}`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}
