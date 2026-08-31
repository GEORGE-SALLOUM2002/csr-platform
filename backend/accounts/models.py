"""
نماذج المستخدمين والأدوار.
- User: مستخدم مخصّص يسجّل الدخول بالبريد الإلكتروني، وله دور (مدير/مشرف/طبيب).
- DoctorProfile: بيانات الطبيب المنتسب المرتبطة بحسابه.
"""
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.core.files.storage import storages
from django.utils import timezone

from config.validators import credential_validators, image_validators


def private_media_storage():
    """تخزين خاص للوثائق الحسّاسة (لا يُخدَم عبر Nginx إطلاقاً)."""
    return storages["private"]


class UserManager(BaseUserManager):
    """مدير إنشاء المستخدمين (نستخدم البريد بدل اسم المستخدم)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("البريد الإلكتروني مطلوب")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_approved", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """المستخدم الأساسي للنظام."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "مدير النظام"
        EDITOR = "EDITOR", "مشرف علمي"
        DOCTOR = "DOCTOR", "طبيب منتسب"

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "بانتظار المراجعة"
        APPROVED = "APPROVED", "معتمد"
        REJECTED = "REJECTED", "مرفوض"

    email = models.EmailField("البريد الإلكتروني", unique=True)
    full_name = models.CharField("الاسم الكامل", max_length=150)
    role = models.CharField("الدور", max_length=10, choices=Role.choices, default=Role.DOCTOR)

    # حالة مراجعة طلب الانتساب (بانتظار/معتمد/مرفوض)
    review_status = models.CharField(
        "حالة المراجعة", max_length=10,
        choices=ReviewStatus.choices, default=ReviewStatus.PENDING,
    )
    # يبقى متوافقاً مع بقية النظام: True فقط عند الاعتماد
    is_approved = models.BooleanField("معتمد", default=False)

    is_active = models.BooleanField("نشِط", default=True)
    is_staff = models.BooleanField("موظف (لوحة أدمن Django)", default=False)
    date_joined = models.DateTimeField("تاريخ التسجيل", default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "مستخدم"
        verbose_name_plural = "المستخدمون"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"

    # اختصارات مفيدة للتحقق من الدور
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_editor(self):
        return self.role == self.Role.EDITOR

    @property
    def is_doctor(self):
        return self.role == self.Role.DOCTOR


class DoctorProfile(models.Model):
    """الملف الشخصي للطبيب المنتسب (يظهر في دليل الأطباء)."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="doctor_profile", verbose_name="المستخدم"
    )
    photo = models.ImageField(
        "الصورة", upload_to="doctors/", blank=True, null=True,
        validators=image_validators(3),
    )
    # رابط إثبات اختياري (بديل أو مكمّل لملفات الاعتماد)
    proof_url = models.URLField("رابط إثبات (اختياري)", max_length=500, blank=True)

    specialty_ar = models.CharField("الاختصاص (عربي)", max_length=150, blank=True)
    specialty_en = models.CharField("الاختصاص (إنجليزي)", max_length=150, blank=True)

    degree_ar = models.CharField("الدرجة العلمية (عربي)", max_length=120, blank=True)
    degree_en = models.CharField("الدرجة العلمية (إنجليزي)", max_length=120, blank=True)

    workplace_ar = models.CharField("جهة العمل (عربي)", max_length=200, blank=True)
    workplace_en = models.CharField("جهة العمل (إنجليزي)", max_length=200, blank=True)

    bio_ar = models.TextField("نبذة (عربي)", blank=True)
    bio_en = models.TextField("نبذة (إنجليزي)", blank=True)

    phone = models.CharField("الهاتف", max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ملف طبيب"
        verbose_name_plural = "ملفات الأطباء"

    def __str__(self):
        return f"ملف: {self.user.full_name}"


class DoctorCredential(models.Model):
    """مستند يثبت أن صاحب الطلب طبيب (صورة أو PDF) يُرفَق عند التسجيل ويراجعه المدير."""
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="credentials", verbose_name="المستخدم"
    )
    file = models.FileField(
        "مستند الإثبات", upload_to="credentials/", storage=private_media_storage,
        validators=credential_validators(5),
    )
    uploaded_at = models.DateTimeField("تاريخ الرفع", auto_now_add=True)

    class Meta:
        verbose_name = "مستند إثبات"
        verbose_name_plural = "مستندات الإثبات"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"مستند: {self.user.full_name}"
