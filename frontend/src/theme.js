/**
 * سمة MUI لموقع جمعية الأشعة.
 * لتغيير الألوان لاحقاً: عدّل القيم في palettes أدناه فقط.
 * getTheme(mode, dir) تُنشئ السمة حسب الوضع (فاتح/داكن) والاتجاه (rtl/ltr).
 */
import { createTheme } from "@mui/material/styles";

// ألوان العلامة (تركوازي/أخضر طبي) — عدّلها هنا لتغيير هوية الموقع كله
const brand = {
  teal: "#0E7C7B",
  tealDeep: "#0A5A59",
  tealBright: "#2FB8A6",
  highlight: "#1FA98D",
};

const fontBody = '"IBM Plex Sans", "IBM Plex Sans Arabic", system-ui, sans-serif';
const fontDisplay = '"El Messiri", "IBM Plex Sans Arabic", system-ui, sans-serif';

export function getTheme(mode = "light", dir = "rtl") {
  const isDark = mode === "dark";

  return createTheme({
    direction: dir,
    palette: {
      mode,
      primary: {
        main: isDark ? brand.tealBright : brand.teal,
        dark: brand.tealDeep,
        contrastText: isDark ? "#052622" : "#ffffff",
      },
      secondary: { main: brand.highlight },
      background: {
        default: isDark ? "#061917" : "#F1F7F5",
        paper: isDark ? "#0D2523" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E7F2EF" : "#0B2B29",
        secondary: isDark ? "#9BB8B3" : "#4E6C68",
      },
      divider: isDark ? "#1E3B37" : "#D3E5E0",
      success: { main: isDark ? "#43BE84" : "#2E9E6B" },
      warning: { main: isDark ? "#E0A24A" : "#B87514" },
      error: { main: isDark ? "#E57263" : "#C24638" },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: fontBody,
      h1: { fontFamily: fontDisplay, fontWeight: 700 },
      h2: { fontFamily: fontDisplay, fontWeight: 700 },
      h3: { fontFamily: fontDisplay, fontWeight: 600 },
      h4: { fontFamily: fontDisplay, fontWeight: 600 },
      h5: { fontFamily: fontDisplay, fontWeight: 600 },
      h6: { fontFamily: fontDisplay, fontWeight: 600 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiButton: {
        styleOverrides: { root: { borderRadius: 999 } },
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: `1px solid ${isDark ? "#1E3B37" : "#D3E5E0"}`,
          },
        },
      },
      MuiAppBar: { defaultProps: { color: "default", elevation: 0 } },
      // حقول الإدخال بخلفية بيضاء (أو داكنة مطابقة للبطاقة) بدل الرمادي الفاتح
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#0D2523" : "#FFFFFF",
            "&.Mui-disabled": { backgroundColor: isDark ? "#0A1F1D" : "#F7FAF9" },
            // إبقاء الحقل أبيض دائماً — حتى عند الإكمال التلقائي (autofill) من المتصفح
            "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active": {
              WebkitBoxShadow: `0 0 0 100px ${isDark ? "#0D2523" : "#FFFFFF"} inset`,
              WebkitTextFillColor: isDark ? "#E7F2EF" : "#0B2B29",
              caretColor: isDark ? "#E7F2EF" : "#0B2B29",
              borderRadius: "inherit",
              transition: "background-color 9999s ease-in-out 0s",
            },
          },
        },
      },
    },
  });
}
