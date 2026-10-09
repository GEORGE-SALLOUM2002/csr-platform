/**
 * روابط الفيديو الخارجية: YouTube و Microsoft OneDrive/SharePoint (Stream) للأعمال.
 * - normalizeVideoInput: يقبل رابطاً أو «كود التضمين» (iframe) ويعيد الرابط فقط.
 * - parseVideoLink: يحدد المنصة ورابط التضمين داخل الموقع (إن أمكن) والصورة المصغّرة.
 * المنصات مطابقة لـ VIDEO_HOSTS في backend/library/serializers.py.
 */
const MS_HOSTS = ["sharepoint.com", "onedrive.live.com", "1drv.ms"];
const YT_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com"];

const hostMatch = (host, list) => list.some((h) => host === h || host.endsWith(`.${h}`));

/** يستخرج src من كود iframe إن لُصق كود تضمين، وإلا يعيد النص كما هو (بعد التشذيب). */
export function normalizeVideoInput(input) {
  const v = (input || "").trim();
  const m = v.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return (m ? m[1] : v).replace(/&amp;/g, "&");
}

function youtubeId(u) {
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be" || host.endsWith(".youtu.be")) return u.pathname.split("/")[1] || null;
  const v = u.searchParams.get("v");
  if (v) return v;
  const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/);
  return m ? m[1] : null;
}

/**
 * @returns {{ provider: "youtube"|"microsoft"|null, embedUrl: string|null, thumb: string|null }}
 * provider=null → رابط غير مدعوم. embedUrl=null → يُفتح كرابط خارجي فقط.
 */
export function parseVideoLink(raw) {
  const empty = { provider: null, embedUrl: null, thumb: null };
  let u;
  try { u = new URL(normalizeVideoInput(raw)); } catch { return empty; }
  if (u.protocol !== "https:") return empty;
  const host = u.hostname.toLowerCase();

  if (hostMatch(host, YT_HOSTS)) {
    const id = youtubeId(u);
    if (!id || !/^[\w-]{6,}$/.test(id)) return { provider: "youtube", embedUrl: null, thumb: null };
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  if (hostMatch(host, MS_HOSTS)) {
    // رابط التضمين من Stream/SharePoint (embed.aspx) أو OneDrive (/embed) يُعرض داخل الموقع؛
    // رابط المشاركة العادي (/:v:/...) لا تسمح Microsoft بتضمينه، فيُفتح في نافذة جديدة.
    const embeddable = /\/embed(\.aspx)?(\/|$|\?)/i.test(u.pathname + "?") || u.searchParams.get("action") === "embedview";
    return { provider: "microsoft", embedUrl: embeddable ? u.toString() : null, thumb: null };
  }

  return empty;
}

/** رابط الفتح الخارجي (للزر «فتح على المنصة»). */
export function externalVideoUrl(raw) {
  const v = normalizeVideoInput(raw);
  try {
    const u = new URL(v);
    // رابط التضمين من يوتيوب → رابط المشاهدة العادي
    const p = parseVideoLink(v);
    if (p.provider === "youtube" && p.embedUrl) {
      const id = p.embedUrl.split("/embed/")[1].split("?")[0];
      return `https://www.youtube.com/watch?v=${id}`;
    }
    return u.toString();
  } catch {
    return v;
  }
}
