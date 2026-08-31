/** طلبات الحسابات: تصفية + اعتماد/رفض/تفعيل + حذف المرفوض (بتأكيد) + بطاقة مراجعة كاملة. */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Container, Stack, Chip, Button, Snackbar, Alert, Link, Box, Typography, Divider, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, IconButton,
  TextField, MenuItem, InputAdornment,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { PageHeader, Loader, ErrorState, EmptyState } from "../../components/ui";
import { asList } from "../../hooks/useFetch";
import { AdminAPI } from "../../api/services";
import { useAuth } from "../../context/AuthContext";
import { useUI } from "../../context/UISettingsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { tr } from "../../utils/tr";

const TYPE_COLORS = { RESEARCH: "primary", LECTURE: "secondary", ARTICLE: "warning" };
const STATUS_COLORS = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };
const REVIEW_COLORS = { PENDING: "warning", APPROVED: "success", REJECTED: "error" };

export default function ManageAccounts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const isAdmin = user?.role === "ADMIN";
  const { confirm } = useConfirm();

  // فلاتر التصفية
  const [statusF, setStatusF] = useState("PENDING");
  const [roleF, setRoleF] = useState("all");
  const [activeF, setActiveF] = useState("all");
  const [search, setSearch] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", type: "success" });

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null); // الحساب المطلوب حذفه (لنافذة التأكيد)

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const params = {};
    if (statusF !== "all") params.review_status = statusF;
    if (roleF !== "all") params.role = roleF;
    if (activeF === "active") params.is_active = true;
    if (activeF === "suspended") params.is_active = false;
    if (search.trim()) params.search = search.trim();
    AdminAPI.users(params)
      .then((r) => setRows(asList(r.data)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [statusF, roleF, activeF, search]);

  // تحميل مع تأخير بسيط (يمنع الإكثار من الطلبات أثناء الكتابة في البحث)
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  const notify = (msg, type = "success") => setSnack({ open: true, msg, type });

  const openDetail = async (id) => {
    setDetailOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const r = await AdminAPI.get(id);
      setDetail(r.data);
    } catch {
      notify(t("common.error"), "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const act = async (fn, id) => {
    setBusy(true);
    try {
      const r = await fn(id);
      notify(r?.data?.detail || t("common.saved"));
      load();
      if (detail && detail.id === id) {
        const rr = await AdminAPI.get(id);
        setDetail(rr.data);
      }
    } catch (e) {
      notify(e.response?.data?.detail || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const askAct = async (fn, id, opts) => {
    if (!(await confirm(opts))) return;
    act(fn, id);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const r = await AdminAPI.remove(toDelete.id);
      notify(r?.data?.detail || ar("تم الحذف.", "Deleted."));
      if (detail && detail.id === toDelete.id) setDetailOpen(false);
      setToDelete(null);
      load();
    } catch (e) {
      notify(e.response?.data?.detail || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  };

  const StatusChips = ({ u }) => (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
      <Chip size="small" color={REVIEW_COLORS[u.review_status] || "default"} label={t(`status.${u.review_status}`)} />
      <Chip size="small" variant="outlined" color={u.is_active ? "default" : "error"} label={u.is_active ? ar("مفعّل", "Active") : ar("موقوف", "Suspended")} />
    </Stack>
  );

  const ActionButtons = ({ u }) => {
    const st = u.review_status;
    return (
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        {st !== "APPROVED" && (
          <Button size="small" variant="contained" color="success" disabled={busy} onClick={() => askAct(AdminAPI.approve, u.id, { message: ar("اعتماد هذا الحساب؟", "Approve this account?"), confirmText: ar("اعتماد", "Approve"), color: "success" })}>
            {st === "REJECTED" ? ar("إعادة اعتماد", "Re-approve") : t("dashboard.approveAccount")}
          </Button>
        )}
        {st !== "REJECTED" && (
          <Button size="small" variant="outlined" color="error" disabled={busy} onClick={() => askAct(AdminAPI.reject, u.id, { message: ar("رفض هذا الحساب؟ سيُشعَر الطبيب بذلك.", "Reject this account? The physician will be notified."), confirmText: ar("رفض", "Reject"), color: "error" })}>
            {t("dashboard.rejectAccount")}
          </Button>
        )}
        {st === "APPROVED" && (
          <Button size="small" variant="outlined" color={u.is_active ? "warning" : "success"} disabled={busy} onClick={() => askAct(AdminAPI.toggleActive, u.id, { message: u.is_active ? ar("إيقاف هذا الحساب؟", "Deactivate this account?") : ar("تفعيل هذا الحساب؟", "Activate this account?"), confirmText: t("common.confirm") })}>
            {u.is_active ? ar("إيقاف", "Deactivate") : ar("تفعيل", "Activate")}
          </Button>
        )}
        {st === "REJECTED" && (
          <Button size="small" variant="contained" color="error" startIcon={<DeleteForeverRoundedIcon />} disabled={busy} onClick={() => setToDelete(u)}>
            {ar("حذف نهائي", "Delete")}
          </Button>
        )}
      </Stack>
    );
  };

  const selectSx = { minWidth: 150 };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <PageHeader eyebrow={t("nav.dashboard")} title={t("dashboard.accounts")} />

      {/* شريط الفلاتر */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder={ar("بحث بالاسم أو البريد…", "Search by name or email…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>) }}
          sx={{ maxWidth: 420 }}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
          <TextField select size="small" label={ar("الحالة", "Status")} value={statusF} onChange={(e) => setStatusF(e.target.value)} sx={selectSx}>
            <MenuItem value="all">{ar("كل الحالات", "All statuses")}</MenuItem>
            <MenuItem value="PENDING">{t("status.PENDING")}</MenuItem>
            <MenuItem value="APPROVED">{t("status.APPROVED")}</MenuItem>
            <MenuItem value="REJECTED">{t("status.REJECTED")}</MenuItem>
          </TextField>
          {isAdmin && (
            <TextField select size="small" label={ar("الدور", "Role")} value={roleF} onChange={(e) => setRoleF(e.target.value)} sx={selectSx}>
              <MenuItem value="all">{ar("كل الأدوار", "All roles")}</MenuItem>
              <MenuItem value="DOCTOR">{t("roles.DOCTOR")}</MenuItem>
              <MenuItem value="EDITOR">{t("roles.EDITOR")}</MenuItem>
              <MenuItem value="ADMIN">{t("roles.ADMIN")}</MenuItem>
            </TextField>
          )}
          <TextField select size="small" label={ar("التفعيل", "Activation")} value={activeF} onChange={(e) => setActiveF(e.target.value)} sx={selectSx}>
            <MenuItem value="all">{ar("الكل", "All")}</MenuItem>
            <MenuItem value="active">{ar("مفعّل", "Active")}</MenuItem>
            <MenuItem value="suspended">{ar("موقوف", "Suspended")}</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("auth.fullName")}</TableCell>
                <TableCell>{t("auth.email")}</TableCell>
                <TableCell>{ar("الدور", "Role")}</TableCell>
                <TableCell>{ar("الحالة", "Status")}</TableCell>
                <TableCell align={lang === "ar" ? "left" : "right"}>{ar("إجراءات", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{t(`roles.${u.role}`)}</TableCell>
                  <TableCell><StatusChips u={u} /></TableCell>
                  <TableCell align={lang === "ar" ? "left" : "right"}>
                    <Stack direction="row" spacing={1} justifyContent={lang === "ar" ? "flex-start" : "flex-end"} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                      <Button size="small" variant="contained" startIcon={<VisibilityRoundedIcon />} onClick={() => openDetail(u.id)}>
                        {ar("مراجعة", "Review")}
                      </Button>
                      <ActionButtons u={u} />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ===== بطاقة المراجعة الكاملة ===== */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth dir={lang === "ar" ? "rtl" : "ltr"}>
        <DialogTitle sx={{ pr: 6, fontFamily: '"El Messiri", sans-serif', fontWeight: 700 }}>
          {ar("مراجعة طلب الحساب", "Account request review")}
          <IconButton onClick={() => setDetailOpen(false)} sx={{ position: "absolute", top: 8, insetInlineEnd: 8 }} aria-label={t("common.close")}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading || !detail ? (
            <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}><CircularProgress /></Box>
          ) : (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{detail.full_name}</Typography>
                <Typography color="text.secondary">{detail.email}</Typography>
                <Box sx={{ mt: 1 }}><StatusChips u={detail} /></Box>
              </Box>

              <Divider textAlign={lang === "ar" ? "right" : "left"}>
                <Typography variant="body2" color="text.secondary">{ar("المعلومات المُدخلة", "Entered information")}</Typography>
              </Divider>
              {detail.profile ? (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <InfoRow label={t("doctors.specialty")} value={tr(detail.profile, "specialty", lang)} />
                  <InfoRow label={t("doctors.degree")} value={tr(detail.profile, "degree", lang)} />
                  <InfoRow label={t("doctors.workplace")} value={tr(detail.profile, "workplace", lang)} />
                  <InfoRow label={t("dashboard.phone")} value={detail.profile.phone} />
                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <InfoRow label={ar("نبذة", "Bio")} value={tr(detail.profile, "bio", lang)} />
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">{ar("لا يوجد ملف شخصي.", "No profile.")}</Typography>
              )}

              <Divider textAlign={lang === "ar" ? "right" : "left"}>
                <Typography variant="body2" color="text.secondary">{ar("الإثبات (مستندات / رابط)", "Proof (documents / link)")}</Typography>
              </Divider>
              {(detail.documents?.length || detail.profile?.proof_url) ? (
                <Stack spacing={1.5}>
                  {detail.documents?.length > 0 && (
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                      {detail.documents.map((d, i) => (
                        <Button key={d.id} size="small" variant="outlined" startIcon={<DescriptionRoundedIcon />} href={d.file} target="_blank" rel="noopener">
                          {ar("مستند", "Doc")} {i + 1}
                        </Button>
                      ))}
                    </Stack>
                  )}
                  {detail.profile?.proof_url && (
                    <Box>
                      <Button size="small" variant="text" startIcon={<LinkRoundedIcon />} href={detail.profile.proof_url} target="_blank" rel="noopener">
                        {ar("رابط الإثبات", "Proof link")}
                      </Button>
                    </Box>
                  )}
                </Stack>
              ) : (
                <Typography color="text.secondary">{ar("لا يوجد إثبات مرفق.", "No proof attached.")}</Typography>
              )}

              <Divider textAlign={lang === "ar" ? "right" : "left"}>
                <Typography variant="body2" color="text.secondary">{ar("منشورات الطبيب", "Physician's publications")}</Typography>
              </Divider>
              {detail.resources && detail.resources.length > 0 ? (
                <Stack spacing={1}>
                  {detail.resources.map((r) => (
                    <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", p: 1, border: 1, borderColor: "divider", borderRadius: 2 }}>
                      <Chip size="small" color={TYPE_COLORS[r.type]} label={t(`types.${r.type}`)} />
                      <Chip size="small" variant="outlined" color={STATUS_COLORS[r.status]} label={t(`status.${r.status}`)} />
                      <Link href={`/library/${r.id}`} target="_blank" rel="noopener" sx={{ fontWeight: 600 }}>
                        {tr(r, "title", lang)}
                      </Link>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary">{ar("لا توجد منشورات بعد.", "No publications yet.")}</Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        {detail && !detailLoading && (
          <DialogActions sx={{ px: 3, py: 2 }}>
            <ActionButtons u={detail} />
          </DialogActions>
        )}
      </Dialog>

      {/* ===== نافذة تأكيد الحذف النهائي ===== */}
      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} dir={lang === "ar" ? "rtl" : "ltr"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{ar("تأكيد الحذف النهائي", "Confirm permanent deletion")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {ar(
              `سيتم حذف حساب «${toDelete?.full_name || ""}» وكل بياناته ومستنداته نهائياً. لا يمكن التراجع عن هذا الإجراء.`,
              `Account "${toDelete?.full_name || ""}" and all its data and documents will be permanently deleted. This action cannot be undone.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setToDelete(null)} disabled={busy}>{t("common.cancel")}</Button>
          <Button color="error" variant="contained" startIcon={<DeleteForeverRoundedIcon />} disabled={busy} onClick={doDelete}>
            {ar("حذف نهائي", "Delete permanently")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.type} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Box>
  );
}
