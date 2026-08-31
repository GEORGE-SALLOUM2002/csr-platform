/**
 * حارس المسارات: يمنع الوصول لصفحات لوحة التحكم دون تسجيل دخول،
 * ويتحقق من الدور المسموح (roles) إن حُدّد.
 */
import { Navigate, useLocation } from "react-router-dom";
import { Box, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { Loader } from "./ui";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) return <Loader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">{t("dashboard.noAccess")}</Alert>
      </Box>
    );
  }

  return children;
}
