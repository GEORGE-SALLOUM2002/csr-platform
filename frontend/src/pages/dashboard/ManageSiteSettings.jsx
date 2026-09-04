/** إعدادات الموقع: معلومات تواصل الجمعية وروابطها الاجتماعية (للمشرف/المدير). */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, TextField, Button, Typography, Alert, Stack, CircularProgress, Divider,
  Switch, FormControlLabel,
} from "@mui/material";
import { PageHeader, Loader, ErrorState } from "../../components/ui";
import SocialLinks from "../../components/SocialLinks";
import { ContentAPI } from "../../api/services";
import { useFetch } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";

const CONTACT_FIELDS = ["contact_email", "contact_phone", "address_ar", "address_en", "map_url"];
const SOCIAL_FIELDS = ["facebook", "twitter", "instagram", "youtube", "linkedin", "telegram", "whatsapp"];
const ALL = [...CONTACT_FIELDS, ...SOCIAL_FIELDS];

export default function ManageSiteSettings() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirmSave } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => ContentAPI.siteSettings(), []);

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!data) return;
    const init = {};
    ALL.forEach((f) => { init[f] = data[f] || ""; });
    init.require_review = data.require_review ?? true;
    setForm(init);
  }, [data]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!(await confirmSave(true))) return;
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      await ContentAPI.updateSiteSettings(form);
      setSaved(true);
      reload();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const labels = {
    contact_email: ar("البريد الإلكتروني", "Email"),
    contact_phone: ar("الهاتف", "Phone"),
    address_ar: ar("العنوان (عربي)", "Address (Arabic)"),
    address_en: ar("العنوان (إنجليزي)", "Address (English)"),
    map_url: ar("رابط الخريطة", "Map URL"),
    facebook: "Facebook", twitter: "X (Twitter)", instagram: "Instagram",
    youtube: "YouTube", linkedin: "LinkedIn", telegram: "Telegram", whatsapp: ar("واتساب", "WhatsApp"),
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.siteSettings")} subtitle={ar("معلومات التواصل وروابط الجمعية التي تظهر في «تواصل معنا».", "Contact info and association links shown in the Contact page.")} />

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <Card elevation={0}>
          <CardContent component="form" onSubmit={onSubmit} sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              {saved && <Alert severity="success">{t("common.saved")}</Alert>}
              {saveError && <Alert severity="error">{t("common.error")}</Alert>}

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>{ar("مراجعة المحتوى العلمي", "Content moderation")}</Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.require_review}
                      onChange={(e) => setForm((f) => ({ ...f, require_review: e.target.checked }))}
                    />
                  }
                  label={ar("طلب مراجعة المحتوى قبل نشره", "Require review before publishing")}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {form.require_review
                    ? ar("مُفعّل: يبقى محتوى الأطباء «بانتظار المراجعة» حتى يعتمده المشرف/المدير.",
                         "On: doctors' content stays pending until an editor/admin approves it.")
                    : ar("مُعطّل: يُنشَر محتوى الأطباء مباشرةً دون مراجعة.",
                         "Off: doctors' content is published immediately without review.")}
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{ar("معلومات التواصل", "Contact information")}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  {CONTACT_FIELDS.map((f) => (
                    <TextField
                      key={f}
                      label={labels[f]}
                      value={form[f] || ""}
                      onChange={set(f)}
                      fullWidth
                      sx={f === "map_url" ? { gridColumn: { sm: "1 / -1" } } : undefined}
                    />
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{t("contact.followUs")}</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  {SOCIAL_FIELDS.map((f) => (
                    <TextField
                      key={f}
                      label={labels[f]}
                      value={form[f] || ""}
                      onChange={set(f)}
                      type={f === "whatsapp" ? "text" : "url"}
                      placeholder={f === "whatsapp" ? "+9639…" : "https://…"}
                      fullWidth
                    />
                  ))}
                </Box>
                {/* معاينة حيّة للأيقونات */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {ar("معاينة:", "Preview:")}
                  </Typography>
                  <SocialLinks data={form} />
                </Box>
              </Box>

              <Box>
                <Button type="submit" variant="contained" size="large" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}>
                  {t("common.save")}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
