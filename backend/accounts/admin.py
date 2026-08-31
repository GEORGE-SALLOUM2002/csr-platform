"""تسجيل نماذج الحسابات في لوحة تحكم Django."""
from urllib.parse import urlencode

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.core.signing import TimestampSigner
from django.urls import reverse
from django.utils.html import format_html
from .models import User, DoctorProfile, DoctorCredential


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "full_name", "role", "is_approved", "is_active", "date_joined"]
    list_filter = ["role", "is_approved", "is_active"]
    search_fields = ["email", "full_name"]
    readonly_fields = ["date_joined", "last_login"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("المعلومات", {"fields": ("full_name", "role")}),
        ("الصلاحيات", {"fields": ("is_approved", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("تواريخ", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "role", "password1", "password2", "is_approved", "is_active"),
        }),
    )


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "specialty_ar", "workplace_ar", "updated_at"]
    search_fields = ["user__full_name", "specialty_ar"]


@admin.register(DoctorCredential)
class DoctorCredentialAdmin(admin.ModelAdmin):
    # لا نعرض حقل الملف الخام (يتجنّب توليد رابط عام)؛ نوفّر رابط تنزيل موقّعاً بدلاً منه.
    list_display = ["user", "uploaded_at", "download_link"]
    search_fields = ["user__full_name", "user__email"]
    readonly_fields = ["uploaded_at", "download_link"]
    exclude = ["file"]

    @admin.display(description="الوثيقة")
    def download_link(self, obj):
        if not obj.pk or not obj.file:
            return "—"
        sig = TimestampSigner().sign(str(obj.pk))
        url = reverse("credential-download", args=[obj.pk]) + "?" + urlencode({"sig": sig})
        return format_html('<a href="{}" target="_blank" rel="noopener">تنزيل / عرض</a>', url)
