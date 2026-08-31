/** الرسم البصري المستوحى من موجات التصوير الشعاعي (يظهر في الواجهة الرئيسية). */
import { Box } from "@mui/material";

export default function ScanVisual({ size = 360 }) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: size,
        aspectRatio: "1 / 1.04",
        borderRadius: 4,
        border: 1,
        borderColor: "divider",
        background: (theme) =>
          `linear-gradient(160deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
        boxShadow: 6,
        display: "grid",
        placeItems: "center",
        color: "primary.main",
        overflow: "hidden",
      }}
    >
      <Box component="svg" viewBox="0 0 200 200" sx={{ width: "78%", height: "78%" }} fill="none" aria-hidden>
        <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.5" opacity=".18" />
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1.5" opacity=".28" />
        <circle cx="100" cy="100" r="48" stroke="currentColor" strokeWidth="1.5" opacity=".4" />
        <circle cx="100" cy="100" r="26" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
        <path d="M100 8v184M8 100h184" stroke="currentColor" strokeWidth="1" opacity=".22" />
        <g stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M100 150a50 50 0 0 0-50-50" opacity=".8" />
          <path d="M100 150a50 50 0 0 1 50-50" opacity=".8" />
          <path d="M100 150a78 78 0 0 0-78-78" opacity=".45" />
          <path d="M100 150a78 78 0 0 1 78-78" opacity=".45" />
        </g>
        <circle cx="100" cy="150" r="7" fill="currentColor" />
      </Box>
    </Box>
  );
}
