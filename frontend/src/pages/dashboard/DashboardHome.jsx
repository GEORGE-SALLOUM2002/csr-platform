/** الصفحة الرئيسية للوحة التحكم: ترحيب وبطاقات وصول سريع حسب دور المستخدم. */
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Container, Box, Card, CardActionArea, CardContent, Typography, Chip, Alert, Stack,
} from "@mui/material";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { PageHeader } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

const DOCTOR_CARDS = [
  { to: "/dashboard/profile", key: "profile", Icon: PersonRoundedIcon },
  { to: "/dashboard/upload", key: "uploadResource", Icon: CloudUploadRoundedIcon },
  { to: "/dashboard/my-resources", key: "myResources", Icon: FolderRoundedIcon },
];

const EDITOR_CARDS = [
  { to: "/dashboard/review", key: "reviewContent", Icon: FactCheckRoundedIcon },
  { to: "/dashboard/news", key: "manageNews", Icon: ArticleRoundedIcon },
  { to: "/dashboard/announcements", key: "manageAnnouncements", Icon: CampaignRoundedIcon },
];

const ADMIN_CARDS = [
  ...EDITOR_CARDS,
  { to: "/dashboard/accounts", key: "accounts", Icon: ManageAccountsRoundedIcon },
  { to: "/dashboard/members", key: "members", Icon: GroupsRoundedIcon },
];

const CARDS_BY_ROLE = { DOCTOR: DOCTOR_CARDS, EDITOR: EDITOR_CARDS, ADMIN: ADMIN_CARDS };

export default function DashboardHome() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  const cards = CARDS_BY_ROLE[user.role] || [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader title={t("dashboard.title")} />

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {`${t("auth.welcome")}، ${user.full_name}`}
        </Typography>
        <Chip label={t(`roles.${user.role}`)} color="primary" />
      </Stack>

      {user.role === "DOCTOR" && !user.is_approved && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t("auth.pendingApproval")}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
        {cards.map(({ to, key, Icon }) => (
          <Card key={to} elevation={0}>
            <CardActionArea component={RouterLink} to={to} sx={{ height: "100%", p: 1 }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 48, height: 48, borderRadius: 2, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    bgcolor: "primary.main", color: "primary.contrastText",
                  }}
                >
                  <Icon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.05rem" }}>
                  {t(`dashboard.${key}`)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
