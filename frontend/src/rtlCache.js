/** ذواكر emotion لدعم اتجاه اليمين-لليسار (RTL) واليسار-لليمين (LTR) مع MUI. */
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import rtlPlugin from "stylis-plugin-rtl";

export const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export const cacheLtr = createCache({
  key: "mui",
  stylisPlugins: [prefixer],
});
