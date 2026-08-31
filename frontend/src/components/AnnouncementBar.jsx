/** شريط الإعلانات الذكية الظاهر للزوّار أعلى الصفحة (المثبّتة أولاً، مع تدوير تلقائي). */
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Container, IconButton, Link, Typography } from "@mui/material";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ContentAPI } from "../api/services";
import { asList } from "../hooks/useFetch";
import { useUI } from "../context/UISettingsContext";
import { tr } from "../utils/tr";

export default function AnnouncementBar() {
  const { lang } = useUI();
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    ContentAPI.announcements()
      .then((r) => {
        const list = asList(r.data).filter((x) => x.is_live !== false);
        list.sort((a, b) => (b.is_pinned === true) - (a.is_pinned === true));
        setItems(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(timer);
  }, [items]);

  if (hidden || items.length === 0) return null;

  const a = items[idx % items.length];
  const isInternal = a.link && a.link.startsWith("/");
  const detailsLabel = lang === "ar" ? "التفاصيل ←" : "Details →";

  return (
    <Box sx={{ bgcolor: "primary.dark", color: "primary.contrastText" }}>
      <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
        <CampaignRoundedIcon fontSize="small" />
        <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500 }}>
          {tr(a, "title", lang)}
          {a.link ? (
            isInternal ? (
              <Link component={RouterLink} to={a.link} sx={{ color: "inherit", textDecoration: "underline", mx: 1, fontWeight: 700 }}>
                {detailsLabel}
              </Link>
            ) : (
              <Link href={a.link} target="_blank" rel="noopener" sx={{ color: "inherit", textDecoration: "underline", mx: 1, fontWeight: 700 }}>
                {detailsLabel}
              </Link>
            )
          ) : null}
        </Typography>
        {items.length > 1 && (
          <Typography variant="caption" sx={{ opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>
            {idx + 1}/{items.length}
          </Typography>
        )}
        <IconButton size="small" onClick={() => setHidden(true)} sx={{ color: "inherit" }} aria-label="close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Container>
    </Box>
  );
}
