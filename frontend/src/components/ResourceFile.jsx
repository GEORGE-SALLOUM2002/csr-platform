/**
 * عرض ملف المورد العلمي داخل الموقع فقط (بلا تحميل):
 * PDF → عارض صفحات، فيديو → مشغّل محمي، صوت → مشغّل محمي.
 * ملفات Word/PowerPoint القديمة لا يمكن عرضها في المتصفح، فتظهر رسالة توضيحية.
 * الرابط (stream_url) موقّع ومؤقت، ولا يعمل إن فُتح مباشرة في المتصفح.
 */
import { Box, Alert } from "@mui/material";
import PdfViewer from "./PdfViewer";
import VideoPlayer from "./VideoPlayer";
import { resourceFileInfo } from "../utils/fileKind";

export default function ResourceFile({ resource, lang, views }) {
  const ar = (a, e) => (lang === "ar" ? a : e);
  const info = resourceFileInfo(resource, lang);
  if (!info || !resource.stream_url) return null;
  const src = resource.stream_url;

  if (info.kind === "pdf") return <PdfViewer src={src} lang={lang} />;
  if (info.kind === "video") {
    return <VideoPlayer resourceId={resource.id} fileUrl={src} views={views} lang={lang} />;
  }
  if (info.kind === "audio") {
    return (
      <Box
        component="audio"
        src={src}
        controls
        controlsList="nodownload noremoteplayback"
        onContextMenu={(e) => e.preventDefault()}
        preload="metadata"
        sx={{ width: "100%" }}
      />
    );
  }
  return (
    <Alert severity="info">
      {ar(`ملف ${info.label} لا يمكن عرضه داخل الموقع، والتحميل غير متاح. يُرجى إعادة رفعه بصيغة PDF.`,
          `${info.label} files cannot be displayed in the site and downloading is disabled. Please re-upload it as a PDF.`)}
    </Alert>
  );
}
