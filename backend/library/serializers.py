"""مُسلسِلات المكتبة."""
import os
from urllib.parse import urlencode, urlparse

from django.core.signing import TimestampSigner
from django.urls import reverse

from rest_framework import serializers

from content.models import SiteSettings
from .models import Category, Resource

# المنصات المسموح بروابط فيديوهاتها (YouTube + Microsoft OneDrive/SharePoint للأعمال)
VIDEO_HOSTS = ("youtube.com", "youtu.be", "youtube-nocookie.com", "sharepoint.com", "onedrive.live.com", "1drv.ms")


def can_see_counts(request):
    """المدير يرى العدّادات دائماً؛ غيره فقط إن فعّل المدير «إظهار عدد المشاهدات»."""
    if request is None:
        return False
    if not hasattr(request, "_csr_show_counts"):
        u = request.user
        request._csr_show_counts = bool(
            (u.is_authenticated and u.is_admin) or SiteSettings.load().show_view_counts
        )
    return request._csr_show_counts


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name_ar", "name_en", "slug", "order"]
        read_only_fields = ["slug"]


STREAM_SALT = "resource-stream"


def stream_signer():
    return TimestampSigner(salt=STREAM_SALT)


class ResourceSerializer(serializers.ModelSerializer):
    """عرض/إنشاء مورد علمي.

    الملف المرفوع لا يُعاد رابطه المباشر أبداً (منع التحميل): نُرجع بدلاً منه
    stream_url — رابط عرض موقّع محدود الصلاحية — و file_ext لتحديد طريقة العرض.
    """
    stream_url = serializers.SerializerMethodField()
    file_ext = serializers.SerializerMethodField()
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    category_name_ar = serializers.CharField(source="category.name_ar", read_only=True, default="")
    category_name_en = serializers.CharField(source="category.name_en", read_only=True, default="")
    type_display = serializers.CharField(source="get_resource_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Resource
        fields = [
            "id", "title_ar", "title_en", "description_ar", "description_en",
            "content_ar", "content_en",
            "category", "category_name_ar", "category_name_en",
            "resource_type", "type_display",
            "file", "stream_url", "file_ext", "video_url", "view_count", "click_count",
            "author", "author_name",
            "status", "status_display", "rejection_reason",
            "created_at", "published_at",
        ]
        read_only_fields = [
            "author", "status", "rejection_reason", "created_at", "published_at",
            "view_count", "click_count",
        ]
        extra_kwargs = {"file": {"write_only": True}}

    def get_file_ext(self, obj):
        return os.path.splitext(obj.file.name)[1].lstrip(".").lower() if obj.file else ""

    def get_stream_url(self, obj):
        if not obj.file:
            return None
        sig = stream_signer().sign(str(obj.pk))
        return reverse("resources-stream", args=[obj.pk]) + "?" + urlencode({"sig": sig})

    def validate_video_url(self, value):
        if not value:
            return value
        host = (urlparse(value).hostname or "").lower()
        if not any(host == h or host.endswith("." + h) for h in VIDEO_HOSTS):
            raise serializers.ValidationError(
                "يُقبل رابط فيديو من YouTube أو Microsoft OneDrive/SharePoint فقط."
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not can_see_counts(self.context.get("request")):
            data.pop("view_count", None)
            data.pop("click_count", None)
        return data


class ResourceReviewSerializer(serializers.Serializer):
    """اعتماد/رفض مورد من قبل المشرف."""
    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
