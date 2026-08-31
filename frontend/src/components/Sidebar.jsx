/**
 * محتوى الشريط الجانبي (القائمة الجانبية التي تحل محل شريط التنقّل العلوي).
 * يعرض: الشعار + روابط الأقسام العامة + (عند تسجيل الدخول) روابط لوحة التحكم حسب الدور.
 */
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader,
  Divider, Typography, Chip, Avatar,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";
import { useAuth } from "../context/AuthContext";

// رابط مشترك لكل الأدوار: تغيير كلمة المرور
const changePasswordLink = { to: "/dashboard/change-password", labelKey: "dashboard.changePassword", icon: <LockResetRoundedIcon /> };

// روابط الأقسام العامة
const publicLinks = [
  { to: "/", key: "home", icon: <HomeRoundedIcon />, end: true },
  { to: "/library", key: "library", icon: <MenuBookRoundedIcon /> },
  { to: "/doctors", key: "doctors", icon: <GroupsRoundedIcon /> },
  { to: "/activities", key: "activities", icon: <EventRoundedIcon /> },
  { to: "/news", key: "news", icon: <CampaignRoundedIcon /> },
  { to: "/patients", key: "patients", icon: <HealthAndSafetyRoundedIcon /> },
  { to: "/board", key: "board", icon: <Diversity3RoundedIcon /> },
  { to: "/about", key: "about", icon: <InfoRoundedIcon /> },
  { to: "/contact", key: "contact", icon: <MailRoundedIcon /> },
];

// روابط لوحة التحكم حسب الدور
const dashboardLinks = {
  DOCTOR: [
    { to: "/dashboard/profile", labelKey: "dashboard.profile", icon: <PersonRoundedIcon /> },
    { to: "/dashboard/upload", labelKey: "dashboard.uploadResource", icon: <UploadFileRoundedIcon /> },
    { to: "/dashboard/my-resources", labelKey: "dashboard.myResources", icon: <FolderRoundedIcon /> },
  ],
  EDITOR: [
    { to: "/dashboard/accounts", labelKey: "dashboard.accounts", icon: <HowToRegRoundedIcon /> },
    { to: "/dashboard/review", labelKey: "dashboard.reviewContent", icon: <FactCheckRoundedIcon /> },
    { to: "/dashboard/news", labelKey: "dashboard.manageNews", icon: <EditNoteRoundedIcon /> },
    { to: "/dashboard/announcements", labelKey: "dashboard.manageAnnouncements", icon: <CampaignRoundedIcon /> },
    { to: "/dashboard/patients", labelKey: "dashboard.managePatients", icon: <HealthAndSafetyRoundedIcon /> },
    { to: "/dashboard/activities", labelKey: "dashboard.manageActivities", icon: <EventRoundedIcon /> },
    { to: "/dashboard/site-settings", labelKey: "dashboard.siteSettings", icon: <ShareRoundedIcon /> },
  ],
  ADMIN: [
    { to: "/dashboard/accounts", labelKey: "dashboard.accounts", icon: <HowToRegRoundedIcon /> },
    { to: "/dashboard/members", labelKey: "dashboard.members", icon: <ManageAccountsRoundedIcon /> },
    { to: "/dashboard/editors", labelKey: "dashboard.manageEditors", icon: <SupervisorAccountRoundedIcon /> },
    { to: "/dashboard/review", labelKey: "dashboard.reviewContent", icon: <FactCheckRoundedIcon /> },
    { to: "/dashboard/news", labelKey: "dashboard.manageNews", icon: <EditNoteRoundedIcon /> },
    { to: "/dashboard/announcements", labelKey: "dashboard.manageAnnouncements", icon: <CampaignRoundedIcon /> },
    { to: "/dashboard/patients", labelKey: "dashboard.managePatients", icon: <HealthAndSafetyRoundedIcon /> },
    { to: "/dashboard/activities", labelKey: "dashboard.manageActivities", icon: <EventRoundedIcon /> },
    { to: "/dashboard/site-settings", labelKey: "dashboard.siteSettings", icon: <ShareRoundedIcon /> },
  ],
};

function NavItem({ to, icon, label, end, onNavigate }) {
  return (
    <ListItemButton
      component={NavLink}
      to={to}
      end={end}
      onClick={onNavigate}
      sx={{
        borderRadius: 2,
        mx: 1,
        my: 0.3,
        "&.active": {
          bgcolor: "primary.main",
          color: "primary.contrastText",
          "& .MuiListItemIcon-root": { color: "primary.contrastText" },
          "&:hover": { bgcolor: "primary.dark" },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} primaryTypographyProps={{ fontWeight: 500 }} />
    </ListItemButton>
  );
}

export default function Sidebar({ onNavigate }) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  // كل مستخدم مسجّل يرى رابط تغيير كلمة المرور (إضافةً لروابط دوره)
  const roleLinks = user ? [...(dashboardLinks[user.role] || []), changePasswordLink] : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* الشعار */}
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box component="img" src="/logo.svg" alt="" sx={{ width: 42, height: 42 }} />
        <Box>
          <Typography sx={{ fontFamily: '"El Messiri", sans-serif', fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.1 }}>
            {t("brand.name")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("brand.tagline")}
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* روابط الأقسام */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", py: 1 }}>
        <List
          subheader={
            <ListSubheader sx={{ bgcolor: "background.paper", fontWeight: 700, lineHeight: "2.2em" }}>
              {t("nav.sections")}
            </ListSubheader>
          }
        >
          {publicLinks.map((l) => (
            <NavItem key={l.to} to={l.to} end={l.end} icon={l.icon} label={t(`nav.${l.key}`)} onNavigate={onNavigate} />
          ))}
        </List>

        {/* لوحة التحكم (عند تسجيل الدخول) */}
        {isAuthenticated && roleLinks.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <List
              subheader={
                <ListSubheader sx={{ bgcolor: "background.paper", fontWeight: 700, lineHeight: "2.2em" }}>
                  {t("nav.dashboard")}
                </ListSubheader>
              }
            >
              {roleLinks.map((l) => (
                <NavItem key={l.to} to={l.to} icon={l.icon} label={t(l.labelKey)} onNavigate={onNavigate} />
              ))}
            </List>
          </>
        )}
      </Box>

      {/* بطاقة المستخدم في الأسفل */}
      {isAuthenticated && (
        <>
          <Divider />
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 38, height: 38 }}>
              {user.full_name?.charAt(0) || "?"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap fontWeight={600} fontSize=".9rem">
                {user.full_name}
              </Typography>
              <Chip label={t(`roles.${user.role}`)} size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: ".7rem" }} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
