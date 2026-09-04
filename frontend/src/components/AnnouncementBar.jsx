/** شريط الإعلانات الذكية الظاهر للزوّار أعلى الصفحة (المثبّتة أولاً، مع تدوير تلقائي). */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, IconButton, Link, Typography } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ContentAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function AnnouncementBar() {
  const { lang } = useUI();
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    ContentAPI.announcements()
      .then((r) => {
        const list = asList(r.data).filter((x) => x.is_live !== false);
        list.sort((a, b) => (b.is_pinned === true) - (a.is_pinned === true));
        setItems(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items]);

  if (hidden || items.length === 0) return null;

  const a = items[idx % items.length];
  const isInternal = a.link && a.link.startsWith("/");
  const detailsLabel = lang === "ar" ? "التفاصيل ←" : "Details →";

  return (
    <Box
      sx={{
        // تدرّج لوني بارز بهوية الموقع + شريط تمييز سفلي ذهبي لجذب النظر
        background: "linear-gradient(90deg, #0A5A59 0%, #0E7C7B 50%, #1FA98D 100%)",
        color: "#ffffff",
        borderBottom: "3px solid",
        borderColor: "warning.main",
        boxShadow: "0 3px 10px rgba(6,26,25,.28)",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.75 }, py: { xs: 1.25, md: 1.5 } }}
      >
        {/* أيقونة داخل شارة دائرية بارزة مع نبض خفيف */}
        <Box
          sx={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,.18)",
            border: "1px solid rgba(255,255,255,.35)",
            "@keyframes csrPulse": {
              "0%,100%": { transform: "scale(1)", opacity: 1 },
              "50%": { transform: "scale(1.12)", opacity: 0.85 },
            },
            animation: "csrPulse 2s ease-in-out infinite",
          }}
        >
          <CampaignRoundedIcon sx={{ fontSize: 20 }} />
        </Box>

        <Typography
          component="div"
          sx={{
            flexGrow: 1,
            fontWeight: 700,
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            lineHeight: 1.5,
            letterSpacing: 0.2,
          }}
        >
          {tr(a, "title", lang)}
          {a.link ? (
            isInternal ? (
              <Link
                component={RouterLink}
                to={a.link}
                sx={{
                  color: "primary.dark",
                  bgcolor: "#fff",
                  textDecoration: "none",
                  mx: 1.25,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  "&:hover": { bgcolor: "#eafaf6" },
                }}
              >
                {detailsLabel}
              </Link>
            ) : (
              <Link
                href={a.link}
                target="_blank"
                rel="noopener"
                sx={{
                  color: "primary.dark",
                  bgcolor: "#fff",
                  textDecoration: "none",
                  mx: 1.25,
                  px: 1.25,
                  py: 0.35,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                  display: "inline-block",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  "&:hover": { bgcolor: "#eafaf6" },
                }}
              >
                {detailsLabel}
              </Link>
            )
          ) : null}
        </Typography>

        {items.length > 1 && (
          <Typography
            variant="caption"
            sx={{
              flexShrink: 0,
              fontWeight: 700,
              px: 1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: "rgba(255,255,255,.2)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {idx + 1}/{items.length}
          </Typography>
        )}
        <IconButton
          size="small"
          onClick={() => setHidden(true)}
          sx={{ color: "inherit", flexShrink: 0, "&:hover": { bgcolor: "rgba(255,255,255,.2)" } }}
          aria-label="close"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Container>
    </Box>
  );
}
