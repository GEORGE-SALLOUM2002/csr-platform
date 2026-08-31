/** بوابة توعية المرضى: مواضيع توعوية (بطاقة عنوان+مختصر، نافذة أنيقة عند الضغط) + أسئلة شائعة. */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Button,
  Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, IconButton,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DOMPurify from "dompurify";
import { PageHeader, Loader, ErrorState, EmptyState } from "../components/ui";
import { ContentAPI } from "../api/services";
import { useFetch, asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

const stripHtml = (h) => (h ? h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

export default function Patients() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.patientTopics(), []);
  const items = asList(data);
  const topics = items.filter((i) => i.kind === "TOPIC");
  const faqs = items.filter((i) => i.kind === "FAQ");
  const [open, setOpen] = useState(null);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.patients")} title={t("patients.title")} subtitle={t("patients.subtitle")} />

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {t("patients.topics")}
          </Typography>
          {topics.length === 0 ? (
            <EmptyState />
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5, mb: 5 }}>
              {topics.map((tp) => {
                const summary = tr(tp, "summary", lang) || stripHtml(tr(tp, "body", lang)).slice(0, 120);
                return (
                  <Card key={tp.id} elevation={0} sx={{ transition: "box-shadow .2s, transform .2s", "&:hover": { boxShadow: 4, transform: "translateY(-4px)" } }}>
                    <CardActionArea onClick={() => setOpen(tp)} sx={{ height: "100%", p: 1 }}>
                      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                          {tr(tp, "title", lang)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {summary}
                        </Typography>
                        <Typography variant="body2" color="primary" sx={{ mt: "auto", fontWeight: 600 }}>
                          {t("common.readMore")}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Box>
          )}

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            {t("patients.faq")}
          </Typography>
          {faqs.length === 0 ? (
            <EmptyState />
          ) : (
            <Box>
              {faqs.map((f) => (
                <Accordion key={f.id} elevation={0} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography fontWeight={600}>{tr(f, "title", lang)}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                      {tr(f, "body", lang)}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </>
      )}

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
              {tr(open, "summary", lang) && (
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.05rem" }}>
                  {tr(open, "summary", lang)}
                </Typography>
              )}
              <Box
                sx={{
                  lineHeight: 1.9,
                  "& img": { maxWidth: "100%", height: "auto", borderRadius: 2, my: 2 },
                  "& h2, & h3": { fontFamily: '"El Messiri", sans-serif', mt: 3, mb: 1 },
                  "& p": { mb: 1.5 },
                  "& ul, & ol": { pl: 3, mb: 1.5 },
                  "& a": { color: "primary.main" },
                }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tr(open, "body", lang) || "") }}
              />
              {open.video_url && (
                <Button startIcon={<PlayCircleRoundedIcon />} href={open.video_url} target="_blank" rel="noopener" sx={{ mt: 2 }}>
                  {t("activities.watchVideo")}
                </Button>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
}
