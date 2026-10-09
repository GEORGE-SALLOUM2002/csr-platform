/**
 * مشغّل فيديو المحتوى العلمي مع احتساب المشاهدات والضغطات:
 * - رابط خارجي قابل للتضمين (YouTube / Stream-SharePoint embed): صورة مع زر تشغيل،
 *   وعند الضغط يُحمَّل المشغّل داخل الصفحة وتُحتسب «مشاهدة».
 * - زر «فتح على المنصة» يفتح الرابط الأصلي وتُحتسب «ضغطة».
 * - ملف فيديو مرفوع: تُحتسب «مشاهدة» عند أول تشغيل.
 * يعرض العدّادات فقط إن أرسلتها الخلفية (للمدير دائماً، وللجميع إن فعّل المدير إظهارها).
 */
import { useState } from "react";
import { Box, Button, Stack, Chip, Typography } from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AdsClickRoundedIcon from "@mui/icons-material/AdsClickRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import { parseVideoLink, externalVideoUrl } from "../utils/videoLink";
import { trackResource } from "../utils/track";

const frameSx = {
  position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 2,
  overflow: "hidden", bgcolor: "#000",
};

/** شارات العدّادات (تظهر فقط إن كانت القيم موجودة في الاستجابة). */
export function ViewCounts({ views, clicks, lang, size = "medium" }) {
  if (views == null && clicks == null) return null;
  const ar = (a, e) => (lang === "ar" ? a : e);
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {views != null && (
        <Chip size={size} variant="outlined" icon={<VisibilityRoundedIcon />} label={`${views} ${ar("مشاهدة", views === 1 ? "view" : "views")}`} />
      )}
      {clicks != null && (
        <Chip size={size} variant="outlined" icon={<AdsClickRoundedIcon />} label={`${clicks} ${ar("ضغطة على الرابط", clicks === 1 ? "link click" : "link clicks")}`} />
      )}
    </Stack>
  );
}

export default function VideoPlayer({ resourceId, videoUrl, fileUrl, views, clicks, lang }) {
  const ar = (a, e) => (lang === "ar" ? a : e);
  const [playing, setPlaying] = useState(false);
  // زيادة محلية فورية بعد الاحتساب كي يرى المدير الأثر دون إعادة تحميل
  const [extraViews, setExtraViews] = useState(0);
  const [extraClicks, setExtraClicks] = useState(0);

  const link = videoUrl ? parseVideoLink(videoUrl) : null;

  const onView = () => { if (trackResource(resourceId, "view")) setExtraViews((n) => n + 1); };
  const onClick = () => { if (trackResource(resourceId, "click")) setExtraClicks((n) => n + 1); };

  const counts = (
    <ViewCounts
      lang={lang}
      views={views == null ? null : views + extraViews}
      clicks={clicks == null ? null : clicks + extraClicks}
    />
  );

  return (
    <Stack spacing={1.5}>
      {/* فيديو مرفوع كملف */}
      {fileUrl && (
        <Box
          component="video"
          src={fileUrl}
          controls
          // منع التحميل: إخفاء خيار التنزيل وصورة-داخل-صورة والقائمة اليمنى
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          onContextMenu={(e) => e.preventDefault()}
          preload="metadata"
          playsInline
          onPlay={onView}
          sx={{ width: "100%", maxHeight: 520, borderRadius: 2, bgcolor: "#000" }}
        />
      )}

      {/* فيديو برابط خارجي */}
      {link?.embedUrl && (
        <Box sx={frameSx}>
          {playing ? (
            <Box
              component="iframe"
              src={link.embedUrl}
              title="video"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          ) : (
            <Box
              component="button"
              type="button"
              onClick={() => { onView(); setPlaying(true); }}
              aria-label={ar("تشغيل الفيديو", "Play video")}
              sx={{
                position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, p: 0, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                // الصورة المصغّرة فوق تدرّج احتياطي (يظهر إن تعذّر تحميل الصورة)
                background: `${link.thumb ? `center / cover no-repeat url(${link.thumb}), ` : ""}linear-gradient(135deg,#1b3a4a,#0b1220)`,
                "&:hover .play": { transform: "scale(1.08)" },
              }}
            >
              <Box
                className="play"
                sx={{
                  width: 76, height: 76, borderRadius: "50%", bgcolor: "rgba(0,0,0,0.65)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .15s",
                }}
              >
                <PlayArrowRoundedIcon sx={{ fontSize: 48 }} />
              </Box>
            </Box>
          )}
        </Box>
      )}

      {link?.provider && (
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Button
            variant={link.embedUrl ? "outlined" : "contained"}
            startIcon={link.provider === "youtube" ? <YouTubeIcon /> : link.embedUrl ? <OpenInNewRoundedIcon /> : <MovieRoundedIcon />}
            href={externalVideoUrl(videoUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
          >
            {link.provider === "youtube"
              ? ar("فتح على YouTube", "Open on YouTube")
              : ar("فتح الفيديو على Microsoft", "Open video on Microsoft")}
          </Button>
          {!link.embedUrl && (
            <Typography variant="caption" color="text.secondary">
              {ar("يُفتح الفيديو في نافذة جديدة.", "The video opens in a new tab.")}
            </Typography>
          )}
        </Stack>
      )}

      {(fileUrl || link?.provider) && counts}
    </Stack>
  );
}
