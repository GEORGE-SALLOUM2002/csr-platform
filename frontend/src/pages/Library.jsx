/** المكتبة الإلكترونية: بحث + تصفية حسب النوع/التصنيف + بطاقات الموارد. */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Chip, TextField,
  MenuItem, InputAdornment, Stack, Pagination,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { LibraryAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";
import { resourceFileInfo } from "../utils/fileKind";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };
const PAGE_SIZE = 12; // يطابق PAGE_SIZE في إعدادات الخلفية

export default function Library() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    LibraryAPI.categories().then((r) => setCategories(asList(r.data))).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      // المكتبة العامة تعرض المحتوى المعتمد فقط — حتى للمدير/المشرف
      // (الخلفية تُرجع لهم كل الحالات، فبدون هذا يظهر المرفوض وكأنه منشور)
      const params = { status: "APPROVED", page };
      if (search) params.search = search;
      if (type) params.resource_type = type;
      if (category) params.category = category;
      LibraryAPI.resources(params)
        .then((r) => {
          setItems(asList(r.data));
          setCount(Array.isArray(r.data) ? r.data.length : r.data?.count || 0);
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search, type, category, page]);

  // العودة للصفحة الأولى عند تغيير البحث أو التصفية
  useEffect(() => {
    setPage(1);
  }, [search, type, category]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.library")} title={t("library.title")} subtitle={t("library.subtitle")} />

      {/* أدوات البحث والتصفية */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder={t("library.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>) }}
        />
        <TextField select label={t("dashboard.type")} value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">{t("library.allTypes")}</MenuItem>
          {["RESEARCH", "LECTURE", "ARTICLE"].map((tp) => (
            <MenuItem key={tp} value={tp}>{t(`types.${tp}`)}</MenuItem>
          ))}
        </TextField>
        <TextField select label={t("dashboard.category")} value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">{t("library.allCategories")}</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>{tr(c, "name", lang)}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {items.map((r) => (
            <Card key={r.id} elevation={0}>
              <CardActionArea component={RouterLink} to={`/library/${r.id}`} sx={{ height: "100%", p: 1 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Chip label={t(`types.${r.resource_type}`)} color={TYPE_COLORS[r.resource_type]} size="small" />
                    {r.video_url && !r.file_ext && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: "secondary.main" }}>
                        <PlayCircleRoundedIcon fontSize="small" />
                        <Typography variant="caption" fontWeight={700}>{lang === "ar" ? "فيديو" : "Video"}</Typography>
                      </Box>
                    )}
                    {r.file_ext && (() => {
                      const info = resourceFileInfo(r, lang);
                      const Icon = info.icon;
                      return (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: info.color }}>
                          <Icon fontSize="small" />
                          <Typography variant="caption" fontWeight={700}>{info.label}</Typography>
                        </Box>
                      );
                    })()}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.4 }}>
                    {tr(r, "title", lang)}
                  </Typography>
                  <Box sx={{ mt: "auto", pt: 1.5, borderTop: 1, borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("common.by")} {r.author_name}
                    </Typography>
                    {/* عدد المشاهدات: يظهر فقط إن أرسلته الخلفية (للمدير، أو للجميع إن فعّله) */}
                    {r.view_count != null && (r.video_url || resourceFileInfo(r, lang)?.kind === "video") && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: "text.secondary" }}>
                        <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">{r.view_count}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      {!loading && !error && count > PAGE_SIZE && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={Math.ceil(count / PAGE_SIZE)}
            page={page}
            onChange={(_, p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
}
