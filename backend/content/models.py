"""
نماذج المحتوى العام للموقع:
- News: الأخبار والإعلانات (مع جدولة النشر).
- Activity + ActivityFile: الأنشطة والمؤتمرات وملفاتها.
- BoardMember: أعضاء مجلس الإدارة.
- SmartAnnouncement: الإعلانات الذكية (تثبيت + تاريخ انتهاء + إزالة تلقائية).
- PatientTopic: مواضيع بوابة توعية المرضى + الأسئلة الشائعة.
- ContactMessage: رسائل نموذج «تواصل معنا».
"""
from django.conf import settings
from django.db import models
from django.utils import timezone

from config.validators import image_validators, document_validators


# ============================ الأخبار ============================
class News(models.Model):
    """خبر أو إعلان يديره المشرف (يدعم جدولة النشر)."""
    title_ar = models.CharField("العنوان (عربي)", max_length=250)
    title_en = models.CharField("العنوان (إنجليزي)", max_length=250, blank=True)
    body_ar = models.TextField("النص (عربي)", blank=True)
    body_en = models.TextField("النص (إنجليزي)", blank=True)
    image = models.ImageField(
        "صورة", upload_to="news/", blank=True, null=True,
        validators=image_validators(5),
    )
    attachment = models.FileField(
        "مرفق", upload_to="news/files/", blank=True, null=True,
        validators=document_validators(20),
    )

    is_published = models.BooleanField("منشور", default=True)
    publish_at = models.DateTimeField("موعد النشر", default=timezone.now)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="news_items", verbose_name="أنشأه",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "خبر"
        verbose_name_plural = "الأخبار والإعلانات"
        ordering = ["-publish_at"]

    def __str__(self):
        return self.title_ar

    @property
    def is_live(self):
        """هل الخبر ظاهر للجمهور الآن؟"""
        return self.is_published and self.publish_at <= timezone.now()


# ============================ الأنشطة ============================
class Activity(models.Model):
    """نشاط/مؤتمر/ورشة."""

    class Category(models.TextChoices):
        CONFERENCE = "CONFERENCE", "مؤتمر"
        WORKSHOP = "WORKSHOP", "ورشة"
        SEMINAR = "SEMINAR", "ندوة"

    title_ar = models.CharField("العنوان (عربي)", max_length=250)
    title_en = models.CharField("العنوان (إنجليزي)", max_length=250, blank=True)
    description_ar = models.TextField("الوصف (عربي)", blank=True)
    description_en = models.TextField("الوصف (إنجليزي)", blank=True)

    category = models.CharField("النوع", max_length=12, choices=Category.choices, default=Category.CONFERENCE)
    date = models.DateField("التاريخ", null=True, blank=True)
    location_ar = models.CharField("المكان (عربي)", max_length=150, blank=True)
    location_en = models.CharField("المكان (إنجليزي)", max_length=150, blank=True)

    cover_image = models.ImageField(
        "صورة الغلاف", upload_to="activities/", blank=True, null=True,
        validators=image_validators(5),
    )
    video_url = models.URLField("رابط فيديو", blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="activities", verbose_name="أنشأه",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "نشاط"
        verbose_name_plural = "الأنشطة والمؤتمرات"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return self.title_ar


class ActivityFile(models.Model):
    """ملف علمي مرتبط بنشاط."""
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name="files", verbose_name="النشاط")
    title_ar = models.CharField("العنوان (عربي)", max_length=200)
    title_en = models.CharField("العنوان (إنجليزي)", max_length=200, blank=True)
    file = models.FileField(
        "الملف", upload_to="activities/files/", validators=document_validators(20),
    )

    class Meta:
        verbose_name = "ملف نشاط"
        verbose_name_plural = "ملفات الأنشطة"

    def __str__(self):
        return self.title_ar


# ============================ مجلس الإدارة ============================
class BoardMember(models.Model):
    """عضو مجلس الإدارة."""
    name_ar = models.CharField("الاسم (عربي)", max_length=150)
    name_en = models.CharField("الاسم (إنجليزي)", max_length=150, blank=True)
    role_ar = models.CharField("المنصب (عربي)", max_length=120)
    role_en = models.CharField("المنصب (إنجليزي)", max_length=120, blank=True)
    photo = models.ImageField(
        "الصورة", upload_to="board/", blank=True, null=True,
        validators=image_validators(3),
    )
    email = models.EmailField("البريد", blank=True)
    order = models.PositiveIntegerField("الترتيب", default=0)
    is_active = models.BooleanField("ظاهر", default=True)

    class Meta:
        verbose_name = "عضو مجلس إدارة"
        verbose_name_plural = "مجلس الإدارة"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name_ar} — {self.role_ar}"


# ============================ الإعلانات الذكية ============================
class SmartAnnouncement(models.Model):
    """إعلان ذكي: يُثبّت أعلى الموقع ويُزال تلقائياً بعد تاريخ الانتهاء."""
    title_ar = models.CharField("النص (عربي)", max_length=250)
    title_en = models.CharField("النص (إنجليزي)", max_length=250, blank=True)
    link = models.CharField("رابط (اختياري)", max_length=300, blank=True)
    is_pinned = models.BooleanField("مثبّت أعلى الموقع", default=False)
    is_active = models.BooleanField("مُفعّل", default=True)
    starts_at = models.DateTimeField("يبدأ في", default=timezone.now)
    expires_at = models.DateTimeField("ينتهي في", null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="announcements", verbose_name="أنشأه",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "إعلان ذكي"
        verbose_name_plural = "الإعلانات الذكية"
        ordering = ["-is_pinned", "-starts_at"]

    def __str__(self):
        return self.title_ar

    @property
    def is_live(self):
        now = timezone.now()
        if not self.is_active or self.starts_at > now:
            return False
        return self.expires_at is None or self.expires_at >= now


# ============================ توعية المرضى ============================
class PatientTopic(models.Model):
    """موضوع توعوي للمرضى أو سؤال شائع."""

    class Kind(models.TextChoices):
        TOPIC = "TOPIC", "موضوع"
        FAQ = "FAQ", "سؤال شائع"

    kind = models.CharField("النوع", max_length=6, choices=Kind.choices, default=Kind.TOPIC)
    title_ar = models.CharField("العنوان (عربي)", max_length=250)
    title_en = models.CharField("العنوان (إنجليزي)", max_length=250, blank=True)
    # مختصر قصير يظهر في البطاقة
    summary_ar = models.CharField("مختصر (عربي)", max_length=300, blank=True)
    summary_en = models.CharField("مختصر (إنجليزي)", max_length=300, blank=True)
    # المحتوى الكامل (HTML غني) يظهر عند الضغط
    body_ar = models.TextField("المحتوى (عربي)", blank=True)
    body_en = models.TextField("المحتوى (إنجليزي)", blank=True)
    icon = models.CharField("أيقونة (مفتاح)", max_length=40, blank=True, help_text="مفتاح أيقونة تعرضه الواجهة")
    video_url = models.URLField("رابط فيديو", blank=True)
    order = models.PositiveIntegerField("الترتيب", default=0)
    is_active = models.BooleanField("ظاهر", default=True)

    class Meta:
        verbose_name = "موضوع توعية"
        verbose_name_plural = "بوابة توعية المرضى"
        ordering = ["order", "id"]

    def __str__(self):
        return self.title_ar


# ============================ رسائل التواصل ============================
class ContactMessage(models.Model):
    """رسالة واردة من نموذج «تواصل معنا»."""
    name = models.CharField("الاسم", max_length=150)
    email = models.EmailField("البريد")
    message = models.TextField("الرسالة")
    is_read = models.BooleanField("مقروءة", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "رسالة تواصل"
        verbose_name_plural = "رسائل التواصل"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.created_at:%Y-%m-%d}"


# ============================ إعدادات الموقع ============================
class SiteSettings(models.Model):
    """إعدادات عامة (نمط singleton): معلومات تواصل الجمعية وروابطها الاجتماعية.

    صفٌّ واحد فقط (pk=1) — يديره المدير/المشرف من لوحة التحكم، ويظهر في «تواصل معنا».
    """
    # معلومات التواصل
    contact_email = models.EmailField("البريد", blank=True)
    contact_phone = models.CharField("الهاتف", max_length=60, blank=True)
    address_ar = models.CharField("العنوان (عربي)", max_length=250, blank=True)
    address_en = models.CharField("العنوان (إنجليزي)", max_length=250, blank=True)
    map_url = models.URLField("رابط الخريطة", max_length=500, blank=True)

    # روابط التواصل الاجتماعي للجمعية
    facebook = models.URLField("فيسبوك", max_length=300, blank=True)
    twitter = models.URLField("إكس (تويتر)", max_length=300, blank=True)
    instagram = models.URLField("إنستغرام", max_length=300, blank=True)
    youtube = models.URLField("يوتيوب", max_length=300, blank=True)
    linkedin = models.URLField("لينكدإن", max_length=300, blank=True)
    telegram = models.URLField("تيليغرام", max_length=300, blank=True)
    whatsapp = models.URLField("واتساب", max_length=300, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return "إعدادات الموقع"

    def save(self, *args, **kwargs):
        self.pk = 1  # فرض صفٍّ واحد فقط
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
