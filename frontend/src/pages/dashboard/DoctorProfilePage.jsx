/** الملف الشخصي للطبيب: تعديل البيانات ثنائية اللغة والصورة الشخصية. */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardContent, TextField, Button, Typography, Alert, Stack, Avatar, CircularProgress,
} from "@mui/material";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { PageHeader, Loader, ErrorState } from "../../components/ui";
import { AuthAPI } from "../../api/services";
import { useFetch } from "../../hooks/useFetch";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";

const FIELDS = [
  "specialty_ar", "specialty_en",
  "degree_ar", "degree_en",
  "workplace_ar", "workplace_en",
  "bio_ar", "bio_en",
  "phone",
];
const MULTILINE = ["bio_ar", "bio_en"];

export default function DoctorProfilePage() {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const { confirm } = useConfirm();
  const { data, loading, error, reload } = useFetch(() => AuthAPI.myProfile(), []);

  const [form, setForm] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!data) return;
    const init = {};
    FIELDS.forEach((f) => { init[f] = data[f] || ""; });
    setForm(init);
  }, [data]);

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!(await confirm({
      message: ar("حفظ التعديلات على ملفك الشخصي؟", "Save the changes to your profile?"),
      confirmText: t("common.save"),
    }))) return;
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      if (photo) {
        const fd = new FormData();
        FIELDS.forEach((f) => fd.append(f, form[f] ?? ""));
        fd.append("photo", photo);
        await AuthAPI.updateProfile(fd, true);
      } else {
        await AuthAPI.updateProfile(form, false);
      }
      setSaved(true);
      setPhoto(null);
      reload();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("dashboard.profile")} />

      {loading ? (
        <Loader />
      ) : error || !data ? (
        <ErrorState onRetry={reload} />
      ) : (
        <Card elevation={0}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={3}>
                {saved && <Alert severity="success">{t("common.saved")}</Alert>}
                {saveError && <Alert severity="error">{t("common.error")}</Alert>}

                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Avatar src={preview || data.photo || undefined} sx={{ width: 72, height: 72 }} />
                  <Button component="label" variant="outlined" startIcon={<PhotoCameraRoundedIcon />}>
                    {t("dashboard.photo")}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {photo && (
                    <Typography variant="body2" color="text.secondary">
                      {photo.name}
                    </Typography>
                  )}
                </Stack>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  {FIELDS.map((f) => {
                    const multiline = MULTILINE.includes(f);
                    return (
                      <TextField
                        key={f}
                        label={t(`dashboard.${f}`)}
                        value={form[f] || ""}
                        onChange={set(f)}
                        fullWidth
                        multiline={multiline}
                        minRows={multiline ? 3 : undefined}
                        sx={multiline ? { gridColumn: { sm: "1 / -1" } } : undefined}
                      />
                    );
                  })}
                </Box>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
                  >
                    {t("common.save")}
                  </Button>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
