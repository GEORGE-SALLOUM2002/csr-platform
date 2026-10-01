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

// يكسر الكلمات/الروابط الطويلة حتى لا يخرج النص عن حدود البطاقة على الموبايل
const wrapSx = { overflowWrap: "anywhere", wordBreak: "break-word" };
// يقصّ النص إلى عدد أسطر محدّد مع «…»
const clamp = (n) => ({ display: "-webkit-box", WebkitLineClamp: n, WebkitBoxOrient: "vertical", overflow: "hidden" });

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
      <PageHeader title={t("patients.title")} subtitle={t("patients.subtitle")} />

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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" }, gap: { xs: 1.5, md: 2.5 }, mb: 5 }}>
              {topics.map((tp) => {
                const summary = tr(tp, "summary", lang) || stripHtml(tr(tp, "body", lang)).slice(0, 120);
                return (
                  <Card key={tp.id} elevation={0} sx={{ minWidth: 0, transition: "box-shadow .2s, transform .2s", "&:hover": { boxShadow: 4, transform: "translateY(-4px)" } }}>
                    <CardActionArea onClick={() => setOpen(tp)} sx={{ height: "100%", p: { xs: 0.5, md: 1 }, display: "flex", alignItems: "stretch" }}>
                      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%", width: "100%", minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: "1rem", md: "1.05rem" }, lineHeight: 1.5, ...wrapSx, ...clamp(3) }}>
                          {tr(tp, "title", lang)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, ...wrapSx, ...clamp(3) }}>
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
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ "& .MuiAccordionSummary-content": { minWidth: 0 } }}>
                    <Typography fontWeight={600} sx={{ lineHeight: 1.6, ...wrapSx }}>{tr(f, "title", lang)}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-line", ...wrapSx }}>
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
            <DialogTitle sx={{ pr: 6, ...wrapSx, fontFamily: '"El Messiri", sans-serif', fontWeight: 700 }}>
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
                  ...wrapSx,
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
