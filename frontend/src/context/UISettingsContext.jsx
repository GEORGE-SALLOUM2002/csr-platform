/**
 * سياق إعدادات الواجهة: اللغة (عربي/إنجليزي) والوضع (فاتح/داكن).
 * يوفّر أيضاً سمة MUI وذاكرة emotion المناسبة للاتجاه (RTL/LTR).
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import { getTheme } from "../theme";
import { cacheRtl, cacheLtr } from "../rtlCache";
import i18n from "../i18n";

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UISettingsProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("csr-mode") || "light");
  const [lang, setLang] = useState(() => localStorage.getItem("csr-lang") || "ar");
  const dir = lang === "ar" ? "rtl" : "ltr";

  // مزامنة اللغة مع i18n واتجاه الصفحة
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    if (i18n.language !== lang) i18n.changeLanguage(lang);
    localStorage.setItem("csr-lang", lang);
  }, [lang, dir]);

  useEffect(() => {
    localStorage.setItem("csr-mode", mode);
  }, [mode]);

  const theme = useMemo(() => getTheme(mode, dir), [mode, dir]);
  const cache = dir === "rtl" ? cacheRtl : cacheLtr;

  const value = useMemo(
    () => ({
      mode,
      lang,
      dir,
      toggleMode: () => setMode((m) => (m === "light" ? "dark" : "light")),
      toggleLang: () => setLang((l) => (l === "ar" ? "en" : "ar")),
      setLang,
      setMode,
    }),
    [mode, lang, dir]
  );

  return (
    <UICtx.Provider value={value}>
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </CacheProvider>
    </UICtx.Provider>
  );
}
