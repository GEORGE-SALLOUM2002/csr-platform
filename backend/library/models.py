"""
نماذج المكتبة الإلكترونية.
- Category: تصنيفات المحتوى العلمي.
- Resource: مورد علمي (بحث/محاضرة/مقال) يرفعه الطبيب ويعتمده المشرف قبل النشر.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

from config.validators import document_validators


class Category(models.Model):
    """تصنيف داخل المكتبة (مثل: أشعة تشخيصية، تداخلية...)."""
    name_ar = models.CharField("الاسم (عربي)", max_length=120)
    name_en = models.CharField("الاسم (إنجليزي)", max_length=120, blank=True)
    slug = models.SlugField("المُعرّف", max_length=140, unique=True, blank=True)
    order = models.PositiveIntegerField("الترتيب", default=0)

    class Meta:
        verbose_name = "تصنيف"
        verbose_name_plural = "التصنيفات"
        ordering = ["order", "name_ar"]

    def __str__(self):
        return self.name_ar

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name_en or self.name_ar, allow_unicode=True)
            self.slug = base or f"cat-{timezone.now().timestamp():.0f}"
        super().save(*args, **kwargs)


class Resource(models.Model):
    """مورد علمي في المكتبة."""

    class Type(models.TextChoices):
        RESEARCH = "RESEARCH", "بحث"
        LECTURE = "LECTURE", "محاضرة"
        ARTICLE = "ARTICLE", "مقال"

    class Status(models.TextChoices):
        PENDING = "PENDING", "بانتظار المراجعة"
        APPROVED = "APPROVED", "معتمد ومنشور"
        REJECTED = "REJECTED", "مرفوض"

    title_ar = models.CharField("العنوان (عربي)", max_length=250)
    title_en = models.CharField("العنوان (إنجليزي)", max_length=250, blank=True)
    description_ar = models.TextField("الوصف المختصر (عربي)", blank=True)
    description_en = models.TextField("الوصف المختصر (إنجليزي)", blank=True)

    # محتوى المقال الغني (HTML) مع صور مضمّنة يتحكم الطبيب بموضعها
    content_ar = models.TextField("محتوى المقال (عربي)", blank=True)
    content_en = models.TextField("محتوى المقال (إنجليزي)", blank=True)

    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="resources", verbose_name="التصنيف",
    )
    resource_type = models.CharField("النوع", max_length=10, choices=Type.choices, default=Type.RESEARCH)
    file = models.FileField(
        "الملف (PDF)", upload_to="library/", blank=True, null=True,
        validators=document_validators(20),
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name="resources", verbose_name="الكاتب",
    )

    status = models.CharField("الحالة", max_length=10, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField("سبب الرفض", blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reviewed_resources", verbose_name="راجعه",
    )

    created_at = models.DateTimeField("تاريخ الرفع", auto_now_add=True)
    published_at = models.DateTimeField("تاريخ النشر", null=True, blank=True)

    class Meta:
        verbose_name = "مورد علمي"
        verbose_name_plural = "المكتبة العلمية"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title_ar

    def approve(self, reviewer):
        self.status = self.Status.APPROVED
        self.reviewed_by = reviewer
        self.rejection_reason = ""
        self.published_at = timezone.now()
        self.save()

    def reject(self, reviewer, reason=""):
        self.status = self.Status.REJECTED
        self.reviewed_by = reviewer
        self.rejection_reason = reason
        self.save()
