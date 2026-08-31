/**
 * شريط عريض (carousel) في الصفحة الرئيسية يعرض الإعلانات الذكية والمؤتمرات/الأنشطة
 * التي وضعها المشرف أو المدير. عند الضغط:
 *  - مؤتمر/نشاط  → صفحة تفاصيله /activities/:id
 *  - إعلان        → رابطه (داخلي أو خارجي)، أو صفحة الأخبار والإعلانات إن لم يوجد رابط.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Container, Typography, Chip, Button, IconButton } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { ContentAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function FeaturedBanner() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    Promise.all([ContentAPI.announcements(), ContentAPI.activities()])
      .then(([an, ac]) => {
        const anns = asList(an.data)
          .filter((x) => x.is_live !== false)
          .sort((a, b) => (b.is_pinned === true) - (a.is_pinned === true))
          .map((a) => ({ kind: "ann", id: a.id, title: tr(a, "title", lang), link: a.link }));
        const acts = asList(ac.data).map((a) => ({
          kind: "act", id: a.id, title: tr(a, "title", lang),
          category: a.category, date: a.date,
          location: tr(a, "location", lang), image: a.cover_image,
        }));
        setSlides([...acts, ...anns]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const go = useCallback((s) => {
    if (s.kind === "act") {
      navigate(`/activities/${s.id}`);
    } else if (s.link) {
      if (/^https?:\/\//i.test(s.link)) window.open(s.link, "_blank", "noopener");
      else navigate(s.link);
    } else {
      navigate("/news");
    }
  }, [navigate]);

  const move = (d) => setIdx((i) => (i + d + slides.length) % slides.length);

  useEffect(() => {
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides]);

  if (slides.length === 0) return null;

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB") : "");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {lang === "ar" ? "أحدث الإعلانات والمؤتمرات" : "Latest announcements & conferences"}
      </Typography>

      <Box sx={{ position: "relative", height: { xs: 240, md: 320 }, borderRadius: 4, overflow: "hidden", boxShadow: 6, bgcolor: "primary.dark" }}>
        {slides.map((s, i) => {
          const isAct = s.kind === "act";
          const hasImg = isAct && s.image;
          return (
            <Box
              key={`${s.kind}-${s.id}`}
              onClick={() => go(s)}
              role="button"
              tabIndex={i === idx ? 0 : -1}
              onKeyDown={(e) => (e.key === "Enter" ? go(s) : null)}
              sx={{
                position: "absolute",
                inset: 0,
                cursor: "pointer",
                opacity: i === idx ? 1 : 0,
                transition: "opacity .6s ease",
                pointerEvents: i === idx ? "auto" : "none",
                display: "flex",
                alignItems: "flex-end",
                p: { xs: 3, md: 5 },
                color: "#fff",
                backgroundImage: hasImg
                  ? `linear-gradient(90deg, rgba(6,26,25,.85), rgba(6,26,25,.35)), url(${s.image})`
                  : `linear-gradient(120deg, #0A5A59, #12938F)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <Box sx={{ maxWidth: 720 }}>
                <Chip
                  icon={isAct ? <EventRoundedIcon /> : <CampaignRoundedIcon />}
                  label={isAct ? t(`categories.${s.category}`) : (lang === "ar" ? "إعلان" : "Announcement")}
                  size="small"
                  sx={{ bgcolor: "rgba(255,255,255,.2)", color: "#fff", mb: 1.5, "& .MuiChip-icon": { color: "#fff" } }}
                />
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1, textShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
                  {s.title}
                </Typography>
                {isAct && (
                  <Typography sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2, opacity: .95 }}>
                    {s.date && <span>{fmtDate(s.date)}</span>}
                    {s.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <PlaceRoundedIcon fontSize="small" /> {s.location}
                      </span>
                    )}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="inherit"
                  onClick={(e) => { e.stopPropagation(); go(s); }}
                  sx={{ bgcolor: "#fff", color: "primary.dark", "&:hover": { bgcolor: "#fff" } }}
                  endIcon={<ArrowBackRoundedIcon sx={{ transform: lang === "ar" ? "none" : "scaleX(-1)" }} />}
                >
                  {t("common.readMore")}
                </Button>
              </Box>
            </Box>
          );
        })}

        {slides.length > 1 && (
          <>
            <IconButton onClick={() => move(-1)} aria-label="previous" sx={{ position: "absolute", top: "50%", insetInlineStart: 8, transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,.3)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,.5)" } }}>
              <ChevronRightRoundedIcon sx={{ transform: lang === "ar" ? "none" : "scaleX(-1)" }} />
            </IconButton>
            <IconButton onClick={() => move(1)} aria-label="next" sx={{ position: "absolute", top: "50%", insetInlineEnd: 8, transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,.3)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,.5)" } }}>
              <ChevronLeftRoundedIcon sx={{ transform: lang === "ar" ? "none" : "scaleX(-1)" }} />
            </IconButton>
            <Box sx={{ position: "absolute", bottom: 12, insetInlineStart: 0, insetInlineEnd: 0, display: "flex", justifyContent: "center", gap: 1 }}>
              {slides.map((s, i) => (
                <Box key={i} onClick={() => setIdx(i)} sx={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, bgcolor: i === idx ? "#fff" : "rgba(255,255,255,.5)", cursor: "pointer", transition: "width .3s" }} />
              ))}
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
