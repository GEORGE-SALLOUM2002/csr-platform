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
import { eventDateLabel } from "../utils/eventDate";
import VideoPlayer from "./VideoPlayer";

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
          // «أعلى الصفحة فقط» (BAR) تظهر في الشريط العلوي ولا تدخل هذا القسم
          .filter((x) => x.is_live !== false && x.placement !== "BAR")
          .sort((a, b) => (b.is_pinned === true) - (a.is_pinned === true))
          .map((a) => ({
            kind: "ann", id: a.id, title: tr(a, "title", lang), link: a.link,
            image: a.image, video: a.video_url,
            bg: a.bg_color, text: a.text_color,
          }));
        const acts = asList(ac.data).map((a) => ({
          kind: "act", id: a.id, title: tr(a, "title", lang),
          category: a.category, date: a.date, end_date: a.end_date,
          external: a.external_url,
          location: tr(a, "location", lang), image: a.cover_image,
        }));
        setSlides([...acts, ...anns]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const go = useCallback((s) => {
    if (s.kind === "act") {
      // نشاط له رابط خارجي → يُفتح مباشرةً في نافذة جديدة بدل صفحة التفاصيل
      if (s.external) window.open(s.external, "_blank", "noopener,noreferrer");
      else navigate(`/activities/${s.id}`);
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

  const fmtDate = (s) => eventDateLabel(s, lang);

  // شريط مرتفع ليظهر البوستر أو الفيديو كاملاً. إن كانت كل الشرائح نصّية نكتفي بارتفاع صغير.
  const anyMedia = slides.some((s) => s.image || s.video);
  const bannerH = anyMedia ? { xs: 500, sm: 440, md: 480 } : { xs: 240, md: 300 };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {lang === "ar" ? "أحدث الإعلانات والمؤتمرات" : "Latest announcements & conferences"}
      </Typography>

      <Box sx={{ position: "relative", height: bannerH, borderRadius: 4, overflow: "hidden", boxShadow: 6, bgcolor: "primary.dark" }}>
        {slides.map((s, i) => {
          const isAct = s.kind === "act";
          const hasVideo = !isAct && !!s.video;        // فيديو الإعلان يُعرض في جهة الوسائط
          const hasImg = !!s.image;
          const hasMedia = hasImg || hasVideo;
          // ألوان الإعلان إن ضبطها المشرف، وإلا ألوان الموقع
          const txt = s.text || "#FFFFFF";
          const bg = s.bg || null;
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
                color: txt,
                // الوسائط في جهة والنص في جهة (شاشة كبيرة)، أو الوسائط فوق والنص تحتها (موبايل)
                display: "grid",
                gridTemplateColumns: hasMedia ? { xs: "1fr", md: "1.15fr 0.85fr" } : "1fr",
                gridTemplateRows: hasMedia ? { xs: "1fr auto", md: "1fr" } : "1fr",
                ...(bg
                  ? { backgroundColor: bg }
                  : { backgroundImage: `linear-gradient(120deg, #0A5A59, #12938F)` }),
              }}
            >
              {hasVideo && (
                // الضغط داخل المشغّل لا يفتح رابط الإعلان
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{ minWidth: 0, minHeight: 0, overflow: "hidden", display: "grid", alignContent: "center", p: { xs: 1.5, md: 2 } }}
                >
                  <VideoPlayer videoUrl={s.video} lang={lang} />
                </Box>
              )}

              {!hasVideo && hasImg && (
                <Box sx={{ position: "relative", minHeight: 0, overflow: "hidden" }}>
                  {/* نسخة مكبّرة وضبابية من الصورة تملأ الفراغ حولها بدل الأشرطة الفارغة */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${s.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "blur(18px) brightness(.55)",
                      transform: "scale(1.15)",
                    }}
                  />
                  {/* الصورة كاملة بلا قصّ (contain) */}
                  <Box
                    component="img"
                    src={s.image}
                    alt=""
                    loading="lazy"
                    sx={{ position: "relative", width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                </Box>
              )}

              <Box
                sx={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  // مساحة جانبية أوسع بلا وسائط حتى لا يتداخل النص مع أسهم التنقّل
                  px: hasMedia ? { xs: 3, md: 4 } : { xs: 3, md: 8 },
                  pt: { xs: 2.5, md: 4 },
                  pb: { xs: 4.5, md: 5 }, // مساحة أسفل النص لنقاط التنقّل
                }}
              >
                <Box sx={{ maxWidth: 720 }}>
                  <Chip
                    icon={isAct ? <EventRoundedIcon /> : <CampaignRoundedIcon />}
                    label={isAct ? t(`categories.${s.category}`) : (lang === "ar" ? "إعلان" : "Announcement")}
                    size="small"
                    sx={{ bgcolor: `${txt}2E`, color: txt, mb: 1.5, "& .MuiChip-icon": { color: txt } }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1.3rem", sm: "1.6rem", md: "1.9rem" },
                      lineHeight: 1.3,
                      mb: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {s.title}
                  </Typography>
                  {isAct && (
                    <Typography sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2, opacity: .95 }}>
                      {s.date && <span>{fmtDate(s)}</span>}
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
                    sx={{ alignSelf: "flex-start", bgcolor: txt, color: bg || "#0A5A59", "&:hover": { bgcolor: txt, opacity: .9 } }}
                    endIcon={<ArrowBackRoundedIcon sx={{ transform: lang === "ar" ? "none" : "scaleX(-1)" }} />}
                  >
                    {isAct && s.external
                      ? (lang === "ar" ? "اضغط هنا لرؤية المزيد" : "Click here for more")
                      : t("common.readMore")}
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        })}

        {slides.length > 1 && (
          <>
            <IconButton onClick={() => move(-1)} aria-label="previous" sx={{ display: { xs: "none", sm: "inline-flex" }, position: "absolute", top: "50%", insetInlineStart: 8, transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,.3)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,.5)" } }}>
              <ChevronRightRoundedIcon sx={{ transform: lang === "ar" ? "none" : "scaleX(-1)" }} />
            </IconButton>
            <IconButton onClick={() => move(1)} aria-label="next" sx={{ display: { xs: "none", sm: "inline-flex" }, position: "absolute", top: "50%", insetInlineEnd: 8, transform: "translateY(-50%)", bgcolor: "rgba(0,0,0,.3)", color: "#fff", "&:hover": { bgcolor: "rgba(0,0,0,.5)" } }}>
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
