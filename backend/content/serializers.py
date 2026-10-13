"""مُسلسِلات المحتوى العام."""
from rest_framework import serializers
from .models import (
    News, Activity, ActivityFile, BoardMember,
    SmartAnnouncement, PatientTopic, ContactMessage, SiteSettings,
)


class SiteSettingsSerializer(serializers.ModelSerializer):
    """إعدادات الموقع: معلومات التواصل وروابط الجمعية الاجتماعية."""

    class Meta:
        model = SiteSettings
        fields = [
            "contact_email", "contact_phone", "address_ar", "address_en", "map_url",
            "facebook", "twitter", "instagram", "youtube", "linkedin", "telegram", "whatsapp",
            "require_review", "show_view_counts",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        # إظهار/إخفاء عدد المشاهدات قرار المدير وحده
        request = self.context.get("request")
        if "show_view_counts" in attrs and not (request and request.user.is_authenticated and request.user.is_admin):
            attrs.pop("show_view_counts")
        return attrs


class NewsSerializer(serializers.ModelSerializer):
    is_live = serializers.BooleanField(read_only=True)

    class Meta:
        model = News
        fields = [
            "id", "title_ar", "title_en", "body_ar", "body_en",
            "image", "attachment", "is_published", "publish_at",
            "is_live", "created_at",
        ]
        read_only_fields = ["created_at"]


class ActivityFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityFile
        fields = ["id", "title_ar", "title_en", "file"]


class ActivitySerializer(serializers.ModelSerializer):
    files = ActivityFileSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = Activity
        fields = [
            "id", "title_ar", "title_en", "description_ar", "description_en",
            "category", "category_display", "date", "end_date",
            "location_ar", "location_en", "cover_image", "video_url",
            "files", "created_at",
        ]
        read_only_fields = ["created_at"]


    def to_internal_value(self, data):
        """نماذج FormData ترسل الحقل الفارغ كنص فارغ — نحوّله إلى None ليُحذف التاريخ."""
        if hasattr(data, "get"):
            blanks = [f for f in ("date", "end_date") if data.get(f) == ""]
            if blanks:
                data = data.copy()
                for f in blanks:
                    data[f] = None
        return super().to_internal_value(data)

    def validate(self, attrs):
        """تاريخ الانتهاء لا يسبق تاريخ البداية (يعمل عند الإنشاء والتعديل الجزئي)."""
        start = attrs.get("date", getattr(self.instance, "date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if end:
            if not start:
                raise serializers.ValidationError({"end_date": "حدّد تاريخ البداية أولاً."})
            if end < start:
                raise serializers.ValidationError(
                    {"end_date": "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية أو مساوياً له."}
                )
        return attrs


class BoardMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardMember
        fields = ["id", "name_ar", "name_en", "role_ar", "role_en", "photo", "email", "order", "is_active"]


class SmartAnnouncementSerializer(serializers.ModelSerializer):
    is_live = serializers.BooleanField(read_only=True)

    class Meta:
        model = SmartAnnouncement
        fields = [
            "id", "title_ar", "title_en", "link", "is_pinned", "is_active",
            "starts_at", "expires_at", "is_live", "created_at",
        ]
        read_only_fields = ["created_at"]


class PatientTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTopic
        fields = [
            "id", "kind", "title_ar", "title_en",
            "summary_ar", "summary_en", "body_ar", "body_en",
            "icon", "video_url", "order", "is_active",
        ]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "is_read", "created_at"]
        read_only_fields = ["is_read", "created_at"]
