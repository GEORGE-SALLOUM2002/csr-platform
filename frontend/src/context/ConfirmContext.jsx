/**
 * سياق التأكيد: يوفّر دوالّ تُظهر نافذة تأكيد قبل أي إجراء (حذف/إضافة/تعديل)
 * وتعيد Promise بنتيجة المستخدم (true للتأكيد، false للإلغاء).
 *
 * الاستخدام:
 *   const { confirm, confirmDelete, confirmSave } = useConfirm();
 *   if (!(await confirmDelete())) return;   // قبل الحذف
 *   if (!(await confirmSave(isEdit))) return; // قبل الإضافة/التعديل
 */
import { createContext, useContext, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";
import { useUI } from "./UISettingsContext";

const ConfirmCtx = createContext(null);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const { lang } = useUI();
  const ar = (a, e) => (lang === "ar" ? a : e);
  const [state, setState] = useState(null); // { opts, resolve }

  const confirm = useCallback((opts = {}) => new Promise((resolve) => {
    setState({ opts, resolve });
  }), []);

  const confirmDelete = useCallback(
    (message) => confirm({
      title: ar("تأكيد الحذف", "Confirm deletion"),
      message: message || ar("هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.", "Are you sure you want to delete this item? This cannot be undone."),
      confirmText: ar("حذف", "Delete"),
      color: "error",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirm, lang]
  );

  const confirmSave = useCallback(
    (isEdit) => confirm({
      title: ar("تأكيد", "Confirm"),
      message: isEdit
        ? ar("هل تريد حفظ التعديلات على هذا العنصر؟", "Save the changes to this item?")
        : ar("هل تريد إضافة هذا العنصر؟", "Add this item?"),
      confirmText: t("common.save"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirm, lang]
  );

  const close = (result) => {
    setState((s) => {
      if (s) s.resolve(result);
      return null;
    });
  };

  const opts = state?.opts || {};

  return (
    <ConfirmCtx.Provider value={{ confirm, confirmDelete, confirmSave }}>
      {children}
      <Dialog open={!!state} onClose={() => close(false)} dir={lang === "ar" ? "rtl" : "ltr"} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{opts.title || ar("تأكيد", "Confirm")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {opts.message || ar("هل أنت متأكد من المتابعة؟", "Are you sure you want to proceed?")}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => close(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" color={opts.color || "primary"} onClick={() => close(true)}>
            {opts.confirmText || t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}
