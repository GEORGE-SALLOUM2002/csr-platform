"""مسارات المحتوى العام."""
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    NewsViewSet, ActivityViewSet, ActivityFileViewSet, BoardMemberViewSet,
    SmartAnnouncementViewSet, PatientTopicViewSet, ContactMessageViewSet,
    SiteSettingsView, record_visit, site_stats,
)

router = DefaultRouter()
router.register("news", NewsViewSet, basename="news")
router.register("activities", ActivityViewSet, basename="activities")
router.register("activity-files", ActivityFileViewSet, basename="activity-files")
router.register("board", BoardMemberViewSet, basename="board")
router.register("announcements", SmartAnnouncementViewSet, basename="announcements")
router.register("patient-topics", PatientTopicViewSet, basename="patient-topics")
router.register("contact", ContactMessageViewSet, basename="contact")

urlpatterns = [
    path("site-settings/", SiteSettingsView.as_view(), name="site-settings"),
    path("stats/visit/", record_visit, name="stats-visit"),
    path("stats/", site_stats, name="stats"),
] + router.urls
