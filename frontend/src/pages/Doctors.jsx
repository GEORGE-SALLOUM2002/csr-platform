/** دليل الأطباء: بحث عن الأطباء المنتسبين + بطاقاتهم. */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, TextField,
  InputAdornment, Avatar, Stack,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { DoctorsAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function Doctors() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      setError(false);
      const params = {};
      if (search) params.search = search;
      DoctorsAPI.list(params)
        .then((r) => setItems(asList(r.data)))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.doctors")} title={t("doctors.title")} subtitle={t("doctors.subtitle")} />

      {/* بحث */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder={t("common.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon /></InputAdornment>) }}
        />
      </Stack>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {items.map((d) => (
            <Card key={d.id} elevation={0}>
              <CardActionArea component={RouterLink} to={`/doctors/${d.id}`} sx={{ height: "100%", p: 1 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 0.75, height: "100%" }}>
                  <Avatar src={d.photo || "/logo.svg"} sx={{ width: 84, height: 84, mb: 1, bgcolor: "primary.main", fontSize: "2rem" }}>
                    {d.full_name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    {d.full_name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {tr(d, "specialty", lang)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tr(d, "degree", lang)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tr(d, "workplace", lang)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
}
