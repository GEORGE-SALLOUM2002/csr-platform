/**
 * روزنامة الفعاليات في الصفحة الرئيسية.
 * تُجلب التواريخ من الأنشطة والمؤتمرات (/activities/)، وتظهر الأيام التي فيها حدث بلون مميّز:
 *  - مؤتمر             → لون أساسي (primary)
 *  - ورشة / ندوة        → لون ثانوي (warning)
 * عند الضغط على يوم مميّز تظهر فعالياته أسفل الروزنامة مع رابط لتفاصيل كل منها.
 */
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, Container, Typography, IconButton, Card, CardActionArea, Chip, Stack, Divider, Button,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import { ContentAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const MAX_PAGES = 20; // حدّ أمان عند تتبّع صفحات النتائج

/** مفتاح اليوم بصيغة YYYY-MM-DD (بالتوقيت المحلي). */
const dayKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** يحوّل تاريخ الـ API إلى مفتاح يوم دون انزياح المنطقة الزمنية. */
function toKey(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  return isNaN(d) ? null : dayKey(d.getFullYear(), d.getMonth(), d.getDate());
}

/** يجلب كل الأنشطة عبر صفحات النتائج (الـ API مقسّم إلى صفحات). */
async function fetchAllActivities() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const res = await ContentAPI.activities(page === 1 ? undefined : { page });
    all.push(...asList(res.data));
    if (!res.data?.next) break;
  }
  return all;
}

export default function EventsCalendar() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const isAr = lang === "ar";
  const locale = isAr ? "ar-EG" : "en-GB";

  const today = new Date();
  const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAllActivities().then(setEvents).catch(() => {});
  }, []);

  // تجميع الفعاليات حسب اليوم
  const byDay = useMemo(() => {
    const map = {};
    events.forEach((a) => {
      const k = toKey(a.date);
      if (!k) return;
      (map[k] = map[k] || []).push(a);
    });
    return map;
  }, [events]);

  // خلايا الشهر المعروض (الأسبوع يبدأ السبت)
  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay(); // 0 = الأحد
    const offset = (first + 1) % 7; // السبت = 0
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const arr = Array(offset).fill(null);
    for (let d = 1; d <= days; d += 1) arr.push(d);
    while (arr.length % 7) arr.push(null);
    return arr;
  }, [view]);

  const weekDays = useMemo(() => {
    // 2024-01-06 كان يوم سبت
    return Array.from({ length: 7 }, (_, i) =>
      new Date(2024, 0, 6 + i).toLocaleDateString(locale, { weekday: "short" })
    );
  }, [locale]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const move = (d) => {
    setSelected(null);
    setView(({ y, m }) => {
      const nd = new Date(y, m + d, 1);
      return { y: nd.getFullYear(), m: nd.getMonth() };
    });
  };
  const goToday = () => {
    setSelected(null);
    setView({ y: today.getFullYear(), m: today.getMonth() });
  };

  // فعاليات الشهر المعروض (تظهر عند عدم اختيار يوم)
  const monthPrefix = dayKey(view.y, view.m, 1).slice(0, 7);
  const monthEvents = Object.keys(byDay)
    .filter((k) => k.startsWith(monthPrefix))
    .sort()
    .flatMap((k) => byDay[k]);
  const listed = selected ? byDay[selected] || [] : monthEvents;

  const colorOf = (items) =>
    items.some((a) => a.category === "CONFERENCE") ? "primary" : "warning";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        {isAr ? "روزنامة الأنشطة والمؤتمرات" : "Activities & conferences calendar"}
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" }, gap: 3, alignItems: "start" }}>
        {/* ---------- الروزنامة ---------- */}
        <Card elevation={0} sx={{ p: { xs: 1.5, md: 2.5 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <IconButton onClick={() => move(-1)} aria-label="previous month">
              <ChevronRightRoundedIcon sx={{ transform: isAr ? "none" : "scaleX(-1)" }} />
            </IconButton>
            <Stack alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>{monthLabel}</Typography>
              <Button size="small" onClick={goToday} sx={{ minWidth: 0, py: 0 }}>
                {isAr ? "اليوم" : "Today"}
              </Button>
            </Stack>
            <IconButton onClick={() => move(1)} aria-label="next month">
              <ChevronLeftRoundedIcon sx={{ transform: isAr ? "none" : "scaleX(-1)" }} />
            </IconButton>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
            {weekDays.map((w) => (
              <Typography key={w} variant="caption" color="text.secondary" sx={{ textAlign: "center", fontWeight: 700, py: 0.5 }}>
                {w}
              </Typography>
            ))}
            {cells.map((d, i) => {
              if (!d) return <Box key={`e${i}`} />;
              const k = dayKey(view.y, view.m, d);
              const items = byDay[k];
              const has = !!items;
              const color = has ? colorOf(items) : null;
              const isSel = selected === k;
              const isToday = k === todayKey;
              return (
                <Box
                  key={k}
                  role={has ? "button" : undefined}
                  tabIndex={has ? 0 : -1}
                  title={has ? items.map((a) => tr(a, "title", lang)).join(" • ") : undefined}
                  onClick={has ? () => setSelected(isSel ? null : k) : undefined}
                  onKeyDown={has ? (e) => (e.key === "Enter" ? setSelected(isSel ? null : k) : null) : undefined}
                  sx={{
                    aspectRatio: "1 / 1",
                    maxHeight: 56,
                    display: "grid",
                    placeItems: "center",
                    position: "relative",
                    borderRadius: 2,
                    fontWeight: has ? 700 : 400,
                    cursor: has ? "pointer" : "default",
                    border: isToday ? 2 : 0,
                    borderColor: "primary.main",
                    bgcolor: has ? `${color}.main` : "transparent",
                    color: has ? `${color}.contrastText` : "text.primary",
                    boxShadow: isSel ? 4 : 0,
                    outline: isSel ? "2px solid" : "none",
                    outlineColor: "text.primary",
                    outlineOffset: 2,
                    transition: "transform .15s",
                    "&:hover": has ? { transform: "scale(1.08)" } : undefined,
                  }}
                >
                  {d.toLocaleString(locale)}
                  {has && items.length > 1 && (
                    <Box component="span" sx={{ position: "absolute", top: 2, insetInlineEnd: 4, fontSize: ".65rem", fontWeight: 700 }}>
                      {items.length.toLocaleString(locale)}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* مفتاح الألوان */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
            <Legend color="primary.main" label={t("categories.CONFERENCE")} />
            <Legend color="warning.main" label={`${t("categories.WORKSHOP")} / ${t("categories.SEMINAR")}`} />
          </Stack>
        </Card>

        {/* ---------- فعاليات اليوم المختار / الشهر ---------- */}
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            {selected
              ? new Date(`${selected}T00:00:00`).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : (isAr ? "فعاليات هذا الشهر" : "Events this month")}
          </Typography>
          <Divider sx={{ mb: 2, width: 60, borderBottomWidth: 3, borderColor: "primary.main" }} />
          <Stack spacing={1.5}>
            {listed.length === 0 && (
              <Typography color="text.secondary">
                {isAr ? "لا توجد فعاليات في هذا الشهر." : "No events this month."}
              </Typography>
            )}
            {listed.map((a) => (
              <Card key={a.id} elevation={0}>
                <CardActionArea component={RouterLink} to={`/activities/${a.id}`} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip
                      label={t(`categories.${a.category}`)}
                      size="small"
                      color={a.category === "CONFERENCE" ? "primary" : "warning"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                      {new Date(`${toKey(a.date)}T00:00:00`).toLocaleDateString(locale)}
                    </Typography>
                  </Stack>
                  <Typography fontWeight={600}>{tr(a, "title", lang)}</Typography>
                  {tr(a, "location", lang) && (
                    <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <PlaceRoundedIcon sx={{ fontSize: 16 }} /> {tr(a, "location", lang)}
                    </Typography>
                  )}
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}

function Legend({ color, label }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 14, height: 14, borderRadius: 1, bgcolor: color }} />
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Stack>
  );
}
