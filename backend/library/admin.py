"""لوحة تحكم Django للمكتبة."""
from django.contrib import admin
from .models import Category, Resource


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name_ar", "name_en", "order"]
    search_fields = ["name_ar", "name_en"]


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ["title_ar", "resource_type", "category", "author", "status", "created_at"]
    list_filter = ["status", "resource_type", "category"]
    search_fields = ["title_ar", "title_en"]
    autocomplete_fields = ["author", "reviewed_by", "category"]
    readonly_fields = ["created_at", "published_at"]
