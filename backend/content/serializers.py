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
            "require_review",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


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
            "category", "category_display", "date",
            "location_ar", "location_en", "cover_image", "video_url",
            "files", "created_at",
        ]
        read_only_fields = ["created_at"]


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
