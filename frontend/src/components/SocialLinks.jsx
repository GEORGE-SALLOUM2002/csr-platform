/** صفّ أيقونات روابط التواصل الاجتماعي — يعرض المتوفّر منها فقط. */
import { IconButton, Stack, Tooltip } from "@mui/material";
import Facebook from "@mui/icons-material/Facebook";
import X from "@mui/icons-material/X";
import Instagram from "@mui/icons-material/Instagram";
import YouTube from "@mui/icons-material/YouTube";
import LinkedIn from "@mui/icons-material/LinkedIn";
import Telegram from "@mui/icons-material/Telegram";
import WhatsApp from "@mui/icons-material/WhatsApp";
import Language from "@mui/icons-material/Language";

const ICONS = {
  website: { Icon: Language, label: "الموقع" },
  facebook: { Icon: Facebook, label: "Facebook" },
  twitter: { Icon: X, label: "X" },
  instagram: { Icon: Instagram, label: "Instagram" },
  youtube: { Icon: YouTube, label: "YouTube" },
  linkedin: { Icon: LinkedIn, label: "LinkedIn" },
  telegram: { Icon: Telegram, label: "Telegram" },
  whatsapp: { Icon: WhatsApp, label: "WhatsApp" },
};

const ORDER = ["website", "facebook", "twitter", "instagram", "youtube", "linkedin", "telegram", "whatsapp"];

function normalize(key, value) {
  const v = String(value).trim();
  if (key === "whatsapp" && /^\+?[\d\s-]+$/.test(v)) {
    return `https://wa.me/${v.replace(/[^\d]/g, "")}`;
  }
  if (!/^https?:\/\//i.test(v) && !v.startsWith("mailto:")) return `https://${v}`;
  return v;
}

export default function SocialLinks({ data, size = "medium", color = "primary", justify = "flex-start" }) {
  if (!data) return null;
  const items = ORDER.filter((k) => data[k]);
  if (items.length === 0) return null;
  return (
    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap", justifyContent: justify }}>
      {items.map((k) => {
        const { Icon, label } = ICONS[k];
        return (
          <Tooltip key={k} title={label}>
            <IconButton
              component="a"
              href={normalize(k, data[k])}
              target="_blank"
              rel="noopener noreferrer"
              size={size}
              color={color}
              aria-label={label}
              sx={{ border: 1, borderColor: "divider" }}
            >
              <Icon fontSize={size === "small" ? "small" : "medium"} />
            </IconButton>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
