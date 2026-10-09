/**
 * تحديد نوع الملف المرفق (PDF / فيديو / صوت / مستند / عرض تقديمي) من رابطه أو اسمه،
 * مع الأيقونة والتسمية المناسبة — لعرض المرفقات بشكل صحيح في كل الصفحات.
 * امتدادات رفع المحتوى العلمي مطابقة لـ RESOURCE_EXTS في backend/config/validators.py.
 */
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import AudiotrackRoundedIcon from "@mui/icons-material/AudiotrackRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

// الامتدادات المسموح بها لرفع المحتوى العلمي (يجب أن تطابق الخلفية).
// المحتوى يُعرض داخل الموقع فقط بلا تحميل، لذا نقبل ما يستطيع المتصفح عرضه؛
// ملفات Word/PowerPoint تُحوَّل إلى PDF قبل الرفع.
export const ALLOWED_EXTS = ["pdf", "mp4", "mp3", "wav"];
export const ACCEPT_ATTR = ALLOWED_EXTS.map((e) => `.${e}`).join(",");
// الحد الأقصى للحجم (يطابق document_validators(2000) لحقل ملف المورد)
export const MAX_FILE_MB = 2000;

const KINDS = {
  pdf: { icon: PictureAsPdfRoundedIcon, color: "error.main", ar: "PDF", en: "PDF" },
  video: { icon: MovieRoundedIcon, color: "secondary.main", ar: "فيديو", en: "Video" },
  audio: { icon: AudiotrackRoundedIcon, color: "success.main", ar: "صوت", en: "Audio" },
  doc: { icon: DescriptionRoundedIcon, color: "primary.main", ar: "Word", en: "Word" },
  slides: { icon: SlideshowRoundedIcon, color: "warning.main", ar: "عرض تقديمي", en: "Slides" },
  other: { icon: InsertDriveFileRoundedIcon, color: "text.secondary", ar: "ملف", en: "File" },
};

/** امتداد الملف بأحرف صغيرة من رابط أو اسم (مع تجاهل ?query و #hash). */
export function fileExt(src) {
  if (!src) return "";
  const clean = String(src).split(/[?#]/)[0];
  const name = clean.substring(clean.lastIndexOf("/") + 1);
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.substring(dot + 1).toLowerCase();
}

/** نوع الملف: pdf | video | audio | doc | slides | other */
export function fileKind(src) {
  const ext = fileExt(src);
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["ppt", "pptx"].includes(ext)) return "slides";
  return "other";
}

/** معلومات العرض: { kind, icon, color, label } حسب اللغة. */
export function fileKindInfo(src, lang = "ar") {
  const kind = fileKind(src);
  const k = KINDS[kind];
  return { kind, icon: k.icon, color: k.color, label: lang === "ar" ? k.ar : k.en };
}

/** معلومات العرض لملف مورد علمي — الخلفية لا تُرسل رابط الملف، بل امتداده فقط (file_ext). */
export function resourceFileInfo(resource, lang = "ar") {
  const ext = resource?.file_ext;
  return ext ? fileKindInfo(`.${ext}`, lang) : null;
}
