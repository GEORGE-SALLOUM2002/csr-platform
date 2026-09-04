/**
 * حقل كلمة مرور قابل لإعادة الاستخدام مع زر إظهار/إخفاء.
 * يعمل كبديل مباشر عن <TextField type="password" />: يقبل كل خصائص TextField،
 * ويضيف زرّاً داخل الحقل لتبديل رؤية كلمة المرور.
 * ملاحظة: مبني على واجهة MUI v9 (slotProps.input) بدل InputProps المحذوفة.
 */
import { useState } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { useUI } from "../context/UISettingsContext";

export default function PasswordField({ slotProps, ...props }) {
  const [show, setShow] = useState(false);
  const { lang } = useUI();
  const showLabel = lang === "ar" ? "إظهار كلمة المرور" : "Show password";
  const hideLabel = lang === "ar" ? "إخفاء كلمة المرور" : "Hide password";

  const adornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShow((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        edge="end"
        size="small"
        aria-label={show ? hideLabel : showLabel}
        title={show ? hideLabel : showLabel}
        tabIndex={-1}
      >
        {show ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <TextField
      {...props}
      type={show ? "text" : "password"}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input || {}),
          endAdornment: adornment,
        },
      }}
    />
  );
}
