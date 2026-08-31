"""
مُحقِّقات مشتركة للملفات المرفوعة (الحجم والامتداد).

تُطبَّق على حقول الملفات في النماذج، فتُفرَض تلقائياً في DRF عند الرفع
(create/update) بغضّ النظر عن الواجهة — مصدر تحقّق واحد موثوق.
"""
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible

# امتدادات مسموح بها (صور / مستندات)
IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"]
DOC_EXTS = ["pdf", "doc", "docx", "ppt", "pptx"]
# وثائق إثبات الطبيب: صورة أو PDF
CREDENTIAL_EXTS = ["jpg", "jpeg", "png", "webp", "pdf"]


@deconstructible
class FileSizeValidator:
    """يرفض الملفات التي يتجاوز حجمها الحد (بالميغابايت)."""

    def __init__(self, max_mb):
        self.max_mb = max_mb

    def __call__(self, value):
        if value and getattr(value, "size", 0) > self.max_mb * 1024 * 1024:
            raise ValidationError(
                f"حجم الملف يتجاوز الحد الأقصى المسموح ({self.max_mb} ميغابايت)."
            )

    def __eq__(self, other):
        return isinstance(other, FileSizeValidator) and self.max_mb == other.max_mb


# مُحقِّقات جاهزة حسب النوع
def image_validators(max_mb=5):
    return [FileSizeValidator(max_mb), FileExtensionValidator(IMAGE_EXTS)]


def document_validators(max_mb=20):
    return [FileSizeValidator(max_mb), FileExtensionValidator(DOC_EXTS)]


def credential_validators(max_mb=5):
    return [FileSizeValidator(max_mb), FileExtensionValidator(CREDENTIAL_EXTS)]
