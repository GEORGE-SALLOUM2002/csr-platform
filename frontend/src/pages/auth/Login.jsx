/** صفحة تسجيل الدخول: بريد إلكتروني وكلمة مرور. */
import { useState } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Card, CardContent, Box, TextField, Button, Typography, Alert, Stack, Link, CircularProgress,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      await login(email, password);
      navigate(location.state?.from || "/dashboard");
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <Card elevation={0}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            {t("auth.loginTitle")}
          </Typography>

          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error">{t("auth.loginError")}</Alert>}
              <TextField
                type="email"
                label={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
              />
              <TextField
                type="password"
                label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {t("auth.login")}
              </Button>
            </Stack>
          </Box>

          <Typography sx={{ mt: 3, textAlign: "center" }}>
            <Link component={RouterLink} to="/register">
              {t("auth.noAccount")}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
