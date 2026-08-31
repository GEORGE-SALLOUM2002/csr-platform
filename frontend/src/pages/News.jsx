/** الأخبار والإعلانات: بطاقات إخبارية، وعند الضغط يُفتح الخبر كاملاً في نافذة أنيقة. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Button, Stack,
  Dialog, DialogTitle, DialogContent, IconButton,
} from "@mui/material";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DOMPurify from "dompurify";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { ContentAPI } from "../api/services";
import { useFetch, asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const stripHtml = (h) => (h ? h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

function excerpt(text, n = 180) {
  if (!text) return "";
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

export default function News() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.news(), []);
  const items = asList(data);
  const [open, setOpen] = useState(null);
  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.news")} title={t("news.title")} subtitle={t("news.subtitle")} />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <Stack spacing={2.5}>
          {items.map((n) => (
            <Card key={n.id} elevation={0} sx={{ transition: "box-shadow .2s", "&:hover": { boxShadow: 4 } }}>
              <CardActionArea onClick={() => setOpen(n)}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
                  {n.image && (
                    <Box
                      component="img"
                      src={n.image}
                      alt={tr(n, "title", lang)}
                      sx={{ width: { xs: "100%", sm: 220 }, height: { xs: 180, sm: "auto" }, objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="caption" color="primary" fontWeight={700}>
                      {fmtDate(n.publish_at)}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, my: 0.5 }}>
                      {tr(n, "title", lang)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {excerpt(stripHtml(tr(n, "body", lang)))}
                    </Typography>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      {t("common.readMore")}
                    </Typography>
                  </CardContent>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      {/* نافذة عرض الخبر كاملاً */}
      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="md" fullWidth dir={lang === "ar" ? "rtl" : "ltr"}>
        {open && (
          <>
            <DialogTitle sx={{ pr: 6, fontFamily: '"El Messiri", sans-serif', fontWeight: 700 }}>
              {tr(open, "title", lang)}
              <IconButton onClick={() => setOpen(null)} sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }} aria-label={t("common.close")}>
                <CloseRoundedIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="primary" fontWeight={700}>
                {fmtDate(open.publish_at)}
              </Typography>
              {open.image && (
                <Box
                  component="img"
                  src={open.image}
                  alt=""
                  sx={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 2, my: 2 }}
                />
              )}
              <Box
                sx={{
                  lineHeight: 1.9,
                  mt: open.image ? 0 : 2,
                  "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, my: 2 },
                  "& h2, & h3": { fontFamily: '"El Messiri", sans-serif', mt: 3, mb: 1 },
                  "& p": { mb: 1.5 },
                  "& ul, & ol": { pl: 3, mb: 1.5 },
                  "& a": { color: "primary.main" },
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tr(open, "body", lang) || "") }}
              />
              {open.attachment && (
                <Button startIcon={<OpenInNewRoundedIcon />} href={open.attachment} target="_blank" rel="noopener" variant="outlined" sx={{ mt: 3 }}>
                  {t("common.download")}
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}
