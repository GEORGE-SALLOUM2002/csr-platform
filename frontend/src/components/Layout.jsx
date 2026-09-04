/**
 * الهيكل العام: شريط جانبي (Drawer) دائم على الشاشات الكبيرة ومؤقّت على الجوال،
 * مع شريط علوي (AppBar) يحوي أزرار اللغة والوضع والدخول/الخروج.
 */
import { useState } from "react";
import { Outlet, useNavigate, Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, AppBar, Toolbar, IconButton, Drawer, Button, Tooltip, Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AnnouncementBar from "./AnnouncementBar";
import { useUI } from "../context/UISettingsContext";
import { useAuth } from "../context/AuthContext";

const drawerWidth = 268;

export default function Layout() {
  const { t } = useTranslation();
  const { mode, toggleMode, toggleLang, lang } = useUI();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // نمرّر anchor="left" دائماً؛ MUI يعكسه تلقائياً إلى اليمين في وضع RTL
  const anchor = "left";
  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {/* ------- الشريط الجانبي ------- */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* نسخة الجوال (مؤقتة) */}
        <Drawer
          variant="temporary"
          anchor={anchor}
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          <Sidebar onNavigate={closeMobile} />
        </Drawer>
        {/* نسخة سطح المكتب (دائمة) */}
        <Drawer
          variant="permanent"
          anchor={anchor}
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", border: 0, boxShadow: "0 0 24px rgba(0,0,0,.05)" },
          }}
        >
          <Sidebar />
        </Drawer>
      </Box>

      {/* ------- المحتوى الرئيسي ------- */}
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AnnouncementBar />
        <AppBar
          position="sticky"
          sx={{
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            backdropFilter: "blur(8px)",
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
              aria-label="menu"
            >
              <MenuRoundedIcon />
            </IconButton>

            <Typography
              component={RouterLink}
              to="/"
              sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, fontWeight: 700, fontFamily: '"El Messiri", sans-serif', color: "text.primary" }}
            >
              <Box component="img" src="/logo.svg" alt="" sx={{ width: 30, height: 30 }} />
              {t("brand.name")}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title={lang === "ar" ? "English" : "العربية"}>
              <Button onClick={toggleLang} color="inherit" startIcon={<TranslateRoundedIcon />} sx={{ minWidth: 0 }}>
                {lang === "ar" ? "EN" : "ع"}
              </Button>
            </Tooltip>

            <Tooltip title={mode === "dark" ? "Light" : "Dark"}>
              <IconButton onClick={toggleMode} color="inherit">
                {mode === "dark" ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <Button onClick={handleLogout} color="inherit" startIcon={<LogoutRoundedIcon />}>
                {t("auth.logout")}
              </Button>
            ) : (
              <Button component={RouterLink} to="/login" variant="contained" startIcon={<LoginRoundedIcon />}>
                {t("auth.login")}
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
