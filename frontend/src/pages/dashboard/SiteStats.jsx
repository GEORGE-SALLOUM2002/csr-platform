/**
 * إحصاءات الموقع (للمدير فقط): زيارات الموقع، مشاهدات الفيديوهات، والضغطات على روابطها،
 * مع مفتاح يتحكم بإظهار عدد المشاهدات للزوار والأعضاء.
 */
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, Switch, FormControlLabel, Alert, Stack,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Link, Chip, Tooltip,
} from "@mui/material";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { StatsAPI } from "../../api/services";
import { useFetch } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { tr } from "../../utils/tr";
import { parseVideoLink } from "../../utils/videoLink";

function StatCard({ label, value }) {
  return (
    <Card elevation={0}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
          {Number(value || 0).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

/** مخطط أعمدة بسيط لزيارات آخر 30 يوماً. */
function DailyBars({ daily, lang }) {
  const max = Math.max(1, ...daily.map((d) => d.count));
  const fmt = (iso) => new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", { day: "numeric", month: "short" });
  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 140 }}>
        {daily.map((d) => (
          <Tooltip key={d.date} title={`${fmt(d.date)}: ${d.count}`} arrow>
            <Box
              sx={{
                flex: 1, minWidth: 0, borderRadius: "3px 3px 0 0",
                height: `${Math.max(2, (d.count / max) * 100)}%`,
                bgcolor: d.count ? "primary.main" : "divider",
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{fmt(daily[0].date)}</Typography>
        <Typography variant="caption" color="text.secondary">{fmt(daily[daily.length - 1].date)}</Typography>
      </Box>
    </Box>
  );
}

export default function SiteStats() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { data, loading, error, reload } = useFetch(() => StatsAPI.get(), []);
  const [show, setShow] = useState(null); // null = القيمة من الخادم
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const showCounts = show ?? data?.show_view_counts ?? false;

  const toggle = async (e) => {
    const value = e.target.checked;
    setSaving(true);
    setSaveError(false);
    setShow(value);
    try {
      await StatsAPI.setShowViewCounts(value);
    } catch {
      setShow(!value);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const sourceLabel = (v) => {
    if (v.video_url) {
      const p = parseVideoLink(v.video_url);
      return p.provider === "youtube" ? "YouTube" : "Microsoft";
    }
    return v.has_file ? ar("ملف مرفوع", "Uploaded file") : "—";
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader
        eyebrow={t("nav.dashboard")}
        title={t("dashboard.stats")}
        subtitle={ar("زيارات الموقع ومشاهدات الفيديوهات والضغطات على روابطها.", "Site visits, video views and link clicks.")}
      />

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <Stack spacing={3}>
          {/* مفتاح إظهار العدّادات للآخرين */}
          <Card elevation={0}>
            <CardContent>
              <FormControlLabel
                control={<Switch checked={showCounts} onChange={toggle} disabled={saving} />}
                label={<Typography sx={{ fontWeight: 700 }}>{ar("إظهار عدد المشاهدات للزوار والأعضاء", "Show view counts to visitors and members")}</Typography>}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {showCounts
                  ? ar("مُفعّل: يظهر عدد المشاهدات والضغطات بجانب كل فيديو لكل من يزور الموقع.",
                       "On: view and click counts appear next to each video for everyone.")
                  : ar("مُعطّل: الأعداد تظهر لك أنت (المدير) فقط.", "Off: counts are visible to you (admin) only.")}
              </Typography>
              {saveError && <Alert severity="error" sx={{ mt: 1 }}>{t("common.error")}</Alert>}
            </CardContent>
          </Card>

          {/* الزيارات */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{ar("زيارات الموقع", "Site visits")}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
              <StatCard label={ar("اليوم", "Today")} value={data.visits.today} />
              <StatCard label={ar("آخر 7 أيام", "Last 7 days")} value={data.visits.last_7} />
              <StatCard label={ar("آخر 30 يوماً", "Last 30 days")} value={data.visits.last_30} />
              <StatCard label={ar("الإجمالي", "All time")} value={data.visits.total} />
            </Box>
            <Card elevation={0} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {ar("الزيارات اليومية — آخر 30 يوماً", "Daily visits — last 30 days")}
                </Typography>
                <DailyBars daily={data.visits.daily} lang={lang} />
              </CardContent>
            </Card>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {ar("تُحتسب زيارة واحدة لكل جلسة متصفح (إعادة تحميل الصفحة لا تُحتسب زيارة جديدة).",
                  "One visit is counted per browser session (reloading does not count again).")}
            </Typography>
          </Box>

          {/* الفيديوهات */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>{ar("الفيديوهات", "Videos")}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <StatCard label={ar("إجمالي المشاهدات", "Total views")} value={data.videos.total_views} />
              <StatCard label={ar("إجمالي الضغطات على الروابط", "Total link clicks")} value={data.videos.total_clicks} />
            </Box>
            {data.videos.items.length === 0 ? (
              <Card elevation={0}><EmptyState label={ar("لا توجد فيديوهات بعد.", "No videos yet.")} /></Card>
            ) : (
              <Card elevation={0}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{ar("المحتوى", "Content")}</TableCell>
                        <TableCell>{ar("المصدر", "Source")}</TableCell>
                        <TableCell align="center">{ar("المشاهدات", "Views")}</TableCell>
                        <TableCell align="center">{ar("الضغطات على الرابط", "Link clicks")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.videos.items.map((v) => (
                        <TableRow key={v.id} hover>
                          <TableCell>
                            <Link component={RouterLink} to={`/library/${v.id}`} underline="hover" sx={{ fontWeight: 600 }}>
                              {tr(v, "title", lang)}
                            </Link>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              {v.author_name}
                              {v.status !== "APPROVED" && (
                                <Chip size="small" label={ar("غير منشور", "Unpublished")} sx={{ mx: 1, height: 18 }} />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>{sourceLabel(v)}</TableCell>
                          <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{v.view_count}</TableCell>
                          <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>{v.video_url ? v.click_count : "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </Box>
        </Stack>
      )}
    </Container>
  );
}
