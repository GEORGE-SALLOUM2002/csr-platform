"""تخزين الوسائط الخاصّة (وثائق اعتماد الأطباء)."""
from django.core.files.storage import FileSystemStorage


class PrivateMediaStorage(FileSystemStorage):
    """تخزين خاص لا يُنتج روابط عامة إطلاقاً.

    نتجاوز url() لترفع خطأً بدل الرجوع الصامت إلى MEDIA_URL (سلوك Django
    الافتراضي عندما يكون base_url=None). هكذا يستحيل أن يُسرَّب رابط مباشر
    للوثائق الحسّاسة عن طريق الخطأ؛ الوصول الوحيد هو واجهة التنزيل الموقّعة.
    """

    def url(self, name):
        raise ValueError(
            "الوسائط الخاصّة لا تُخدَم عبر رابط مباشر؛ استخدم واجهة التنزيل الموقّعة."
        )
