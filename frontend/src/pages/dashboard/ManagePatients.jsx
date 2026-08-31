/** إدارة بوابة المرضى: مواضيع توعوية (عنوان + مختصر + محتوى غني) وأسئلة شائعة (سؤال + إجابة). */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, Typography, TextField, MenuItem, Button,
  Stack, Chip, Alert, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DOMPurify from "dompurify";
import { PageHeader, Loader, ErrorState } from "../../components/ui";
import RichEditor from "../../components/RichEditor";
import { ContentAPI } from "../../api/services";
import { useFetch, asList } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const EMPTY = { kind: "TOPIC", title_ar: "", title_en: "", summary_ar: "", summary_en: "", body_ar: "", body_en: "" };

export default function ManagePatients() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.patientTopics(), []);
  const { confirmDelete, confirmSave } = useConfirm();
  const [form, setForm] = useState(EMPTY);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const items = asList(data);
  const isFaq = form.kind === "FAQ";
  const ar = (a, e) => (lang === "ar" ? a : e);
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));
  const setHtml = (k) => (html) => setForm((f) => ({ ...f, [k]: html }));

  const changeKind = (ev) => {
    setForm({ ...EMPTY, kind: ev.target.value });
    setFormKey((k) => k + 1);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!(await confirmSave(false))) return;
    setSaving(true);
    setMsg(null);
    try {
      await ContentAPI.createPatientTopic(form);
      setForm({ ...EMPTY, kind: form.kind });
      setFormKey((k) => k + 1);
      setMsg({ type: "success", text: ar("تمت الإضافة بنجاح.", "Added successfully.") });
      reload();
    } catch {
      setMsg({ type: "error", text: ar("تعذّرت الإضافة.", "Could not add the item.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!(await confirmDelete())) return;
    try {
      await ContentAPI.deletePatientTopic(id);
      reload();
    } catch {
      /* تجاهل */
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("dashboard.managePatients")} subtitle={t("patients.subtitle")} />

      {/* نموذج الإضافة */}
      <Card elevation={0} sx={{ mb: 4 }}>
        <CardContent component="form" onSubmit={submit}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {ar("إضافة عنصر جديد", "Add a new item")}
          </Typography>
          {msg && (
            <Alert severity={msg.type} sx={{ mb: 2 }}>
              {msg.text}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField select label={ar("النوع", "Type")} value={form.kind} onChange={changeKind} sx={{ maxWidth: 260 }}>
              <MenuItem value="TOPIC">{t("patients.topics")}</MenuItem>
              <MenuItem value="FAQ">{t("patients.faq")}</MenuItem>
            </TextField>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label={isFaq ? ar("السؤال (عربي)", "Question (Arabic)") : ar("العنوان (عربي)", "Title (Arabic)")}
                value={form.title_ar}
                onChange={set("title_ar")}
                required
              />
              <TextField
                label={isFaq ? ar("السؤال (إنجليزي)", "Question (English)") : ar("العنوان (إنجليزي)", "Title (English)")}
                value={form.title_en}
                onChange={set("title_en")}
              />
            </Box>

            {isFaq ? (
              /* ---- سؤال شائع: الإجابة نص بسيط ---- */
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField label={ar("الإجابة (عربي)", "Answer (Arabic)")} value={form.body_ar} onChange={set("body_ar")} multiline minRows={3} />
                <TextField label={ar("الإجابة (إنجليزي)", "Answer (English)")} value={form.body_en} onChange={set("body_en")} multiline minRows={3} />
              </Box>
            ) : (
              /* ---- موضوع توعوي: مختصر + محتوى غني ---- */
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <TextField label={ar("مختصر (عربي)", "Summary (Arabic)")} value={form.summary_ar} onChange={set("summary_ar")} helperText={ar("سطر أو سطران يظهران في البطاقة", "A line or two shown on the card")} />
                  <TextField label={ar("مختصر (إنجليزي)", "Summary (English)")} value={form.summary_en} onChange={set("summary_en")} />
                </Box>
                <RichEditor key={`bar-${formKey}`} dir="rtl" label={ar("المحتوى الكامل (عربي)", "Full content (Arabic)")} value={form.body_ar} onChange={setHtml("body_ar")} />
                <RichEditor key={`ben-${formKey}`} dir="ltr" label={ar("المحتوى الكامل (إنجليزي)", "Full content (English)")} value={form.body_en} onChange={setHtml("body_en")} />
              </>
            )}

            <Button type="submit" variant="contained" startIcon={<AddRoundedIcon />} disabled={saving} sx={{ alignSelf: "flex-start" }}>
              {t("common.add")}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* القائمة الحالية */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {ar("العناصر الحالية", "Current items")}
      </Typography>
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : items.length === 0 ? (
        <Typography color="text.secondary">{t("common.empty")}</Typography>
      ) : (
        <Box>
          {items.map((it) => (
            <Accordion key={it.id} elevation={0} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Chip size="small" color={it.kind === "FAQ" ? "secondary" : "primary"} label={it.kind === "FAQ" ? t("patients.faq") : t("patients.topics")} />
                  <Typography fontWeight={600} noWrap>
                    {tr(it, "title", lang)}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {tr(it, "summary", lang) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: "italic" }}>
                    {tr(it, "summary", lang)}
                  </Typography>
                )}
                <Box
                  sx={{ "& img": { maxWidth: "100%", height: "auto", borderRadius: 1 }, mb: 2 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tr(it, "body", lang) || "—") }}
                />
                <Button color="error" size="small" startIcon={<DeleteRoundedIcon />} onClick={() => remove(it.id)}>
                  {t("common.delete")}
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Container>
  );
}
