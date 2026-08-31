/** المكتبة الإلكترونية: بحث + تصفية حسب النوع/التصنيف + بطاقات الموارد. */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Chip, TextField,
  MenuItem, InputAdornment, Stack,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { LibraryAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };

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

  useEffect(() => {
    LibraryAPI.categories().then((r) => setCategories(asList(r.data))).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      const params = {};
      if (search) params.search = search;
      if (type) params.resource_type = type;
      if (category) params.category = category;
      LibraryAPI.resources(params)
        .then((r) => setItems(asList(r.data)))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
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
                    {r.file && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, color: "error.main" }}>
                        <PictureAsPdfRoundedIcon fontSize="small" />
                        <Typography variant="caption" fontWeight={700}>PDF</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.4 }}>
                    {tr(r, "title", lang)}
                  </Typography>
                  <Box sx={{ mt: "auto", pt: 1.5, borderTop: 1, borderColor: "divider" }}>
                    <Typography variant="body2" color="text.secondary">
                      {t("common.by")} {r.author_name}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
