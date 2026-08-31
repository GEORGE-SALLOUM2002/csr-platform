"""لوحة تحكم Django للمحتوى العام."""
from django.contrib import admin
from .models import (
    News, Activity, ActivityFile, BoardMember,
    SmartAnnouncement, PatientTopic, ContactMessage, SiteSettings,
)


class ActivityFileInline(admin.TabularInline):
    model = ActivityFile
    extra = 1


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ["title_ar", "is_published", "publish_at", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title_ar", "title_en"]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ["title_ar", "category", "date", "location_ar"]
    list_filter = ["category"]
    search_fields = ["title_ar", "title_en"]
    inlines = [ActivityFileInline]


@admin.register(BoardMember)
class BoardMemberAdmin(admin.ModelAdmin):
    list_display = ["name_ar", "role_ar", "order", "is_active"]
    list_editable = ["order", "is_active"]


@admin.register(SmartAnnouncement)
class SmartAnnouncementAdmin(admin.ModelAdmin):
    list_display = ["title_ar", "is_pinned", "is_active", "starts_at", "expires_at"]
    list_filter = ["is_pinned", "is_active"]


@admin.register(PatientTopic)
class PatientTopicAdmin(admin.ModelAdmin):
    list_display = ["title_ar", "kind", "order", "is_active"]
    list_filter = ["kind", "is_active"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "is_read", "created_at"]
    list_filter = ["is_read"]
    search_fields = ["name", "email"]


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["__str__", "contact_email", "contact_phone", "updated_at"]

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()  # صفٌّ واحد فقط

    def has_delete_permission(self, request, obj=None):
        return False
