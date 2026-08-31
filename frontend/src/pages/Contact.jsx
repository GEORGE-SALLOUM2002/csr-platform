/** تواصل معنا: معلومات التواصل + روابط الجمعية الاجتماعية + نموذج إرسال رسالة. */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Container, Box, Card, CardContent, Typography, TextField, Button, Stack, Alert, Divider } from "@mui/material";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { PageHeader } from "../components/ui";
import SocialLinks from "../components/SocialLinks";
import { ContentAPI } from "../api/services";
import { useUI } from "../context/UISettingsContext";

// قيم افتراضية إن لم يضبط المدير إعدادات الموقع بعد
const FALLBACK = { email: "info@radiology-assoc.org", phone: "+963 11 123 4567" };
const SOCIAL_KEYS = ["facebook", "twitter", "instagram", "youtube", "linkedin", "telegram", "whatsapp"];

export default function Contact() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    ContentAPI.siteSettings().then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  const s = settings || {};
  const addr = (lang === "ar" ? s.address_ar : s.address_en) || s.address_ar || s.address_en || t("contact.addressValue");
  const emailVal = s.contact_email || FALLBACK.email;
  const phoneVal = s.contact_phone || FALLBACK.phone;
  const hasSocial = SOCIAL_KEYS.some((k) => s[k]);

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSent(false);
    setFailed(false);
    ContentAPI.sendContact({ name, email, message })
      .then(() => {
        setSent(true);
        setName("");
        setEmail("");
        setMessage("");
      })
      .catch(() => setFailed(true))
      .finally(() => setSubmitting(false));
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.contact")} title={t("contact.title")} subtitle={t("contact.subtitle")} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr" }, gap: { xs: 3, md: 5 }, alignItems: "start" }}>
        {/* معلومات التواصل + روابط الجمعية */}
        <Stack spacing={2.5}>
          <ContactRow icon={<MailRoundedIcon />} label={t("contact.email")} value={emailVal} />
          <ContactRow icon={<PhoneRoundedIcon />} label={t("contact.phone")} value={phoneVal} />
          <ContactRow icon={<LocationOnRoundedIcon />} label={t("contact.address")} value={addr} />
          {hasSocial && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t("contact.followUs")}</Typography>
                <SocialLinks data={s} />
              </Box>
            </>
          )}
        </Stack>

        {/* نموذج التواصل */}
        <Card elevation={0}>
          <CardContent component="form" onSubmit={submit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {sent && <Alert severity="success">{t("contact.sent")}</Alert>}
            {failed && (
              <Alert severity="error">
                {lang === "ar" ? "تعذّر إرسال رسالتك، يرجى المحاولة مرة أخرى." : "Could not send your message, please try again."}
              </Alert>
            )}
            <TextField label={t("contact.name")} value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField label={t("contact.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
            <TextField label={t("contact.message")} value={message} onChange={(e) => setMessage(e.target.value)} required fullWidth multiline minRows={4} />
            <Button type="submit" variant="contained" size="large" startIcon={<SendRoundedIcon />} disabled={submitting} sx={{ alignSelf: "flex-start" }}>
              {t("common.send")}
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: "action.hover", color: "primary.main", display: "grid", placeItems: "center", flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography fontWeight={600} sx={{ wordBreak: "break-word" }}>{value}</Typography>
      </Box>
    </Box>
  );
}
