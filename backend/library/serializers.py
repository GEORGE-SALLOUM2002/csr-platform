"""مُسلسِلات المكتبة."""
from rest_framework import serializers
from .models import Category, Resource


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name_ar", "name_en", "slug", "order"]
        read_only_fields = ["slug"]


class ResourceSerializer(serializers.ModelSerializer):
    """عرض/إنشاء مورد علمي."""
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
            "file", "author", "author_name",
            "status", "status_display", "rejection_reason",
            "created_at", "published_at",
        ]
        read_only_fields = ["author", "status", "rejection_reason", "created_at", "published_at"]


class ResourceReviewSerializer(serializers.Serializer):
    """اعتماد/رفض مورد من قبل المشرف."""
    action = serializers.ChoiceField(choices=["approve", "reject"])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
