"""واجهات المحتوى العام."""
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from accounts.permissions import ReadOnlyOrEditor, ReadOnlyOrAdmin, IsEditorOrAdmin
from .models import (
    News, Activity, ActivityFile, BoardMember,
    SmartAnnouncement, PatientTopic, ContactMessage, SiteSettings,
)
from .serializers import (
    NewsSerializer, ActivitySerializer, ActivityFileSerializer, BoardMemberSerializer,
    SmartAnnouncementSerializer, PatientTopicSerializer, ContactMessageSerializer,
    SiteSettingsSerializer,
)

_UPLOAD_PARSERS = [MultiPartParser, FormParser, JSONParser]


class NewsViewSet(viewsets.ModelViewSet):
    """الأخبار — الزائر يرى المنشور فقط، والمشرف يدير الكل (مع جدولة النشر)."""
    serializer_class = NewsSerializer
    permission_classes = [ReadOnlyOrEditor]
    parser_classes = _UPLOAD_PARSERS
    search_fields = ["title_ar", "title_en", "body_ar", "body_en"]
    ordering_fields = ["publish_at", "created_at"]

    def get_queryset(self):
        qs = News.objects.all()
        u = self.request.user
        if u.is_authenticated and (u.is_editor or u.is_admin):
            return qs
        return qs.filter(is_published=True, publish_at__lte=timezone.now())

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ActivityViewSet(viewsets.ModelViewSet):
    """الأنشطة والمؤتمرات — قراءة للجميع، إدارة للمشرف/المدير."""
    queryset = Activity.objects.prefetch_related("files").all()
    serializer_class = ActivitySerializer
    permission_classes = [ReadOnlyOrEditor]
    parser_classes = _UPLOAD_PARSERS
    filterset_fields = ["category"]
    search_fields = ["title_ar", "title_en", "description_ar", "description_en"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ActivityFileViewSet(viewsets.ModelViewSet):
    """ملفات الأنشطة — للمشرف/المدير."""
    queryset = ActivityFile.objects.all()
    serializer_class = ActivityFileSerializer
    permission_classes = [IsEditorOrAdmin]
    parser_classes = _UPLOAD_PARSERS
    filterset_fields = ["activity"]


class BoardMemberViewSet(viewsets.ModelViewSet):
    """مجلس الإدارة — قراءة للجميع، إدارة للمدير فقط."""
    serializer_class = BoardMemberSerializer
    permission_classes = [ReadOnlyOrAdmin]
    parser_classes = _UPLOAD_PARSERS

    def get_queryset(self):
        qs = BoardMember.objects.all()
        u = self.request.user
        if u.is_authenticated and u.is_admin:
            return qs
        return qs.filter(is_active=True)


class SmartAnnouncementViewSet(viewsets.ModelViewSet):
    """الإعلانات الذكية — الزائر يرى الفعّالة فقط (إزالة تلقائية بعد الانتهاء)."""
    serializer_class = SmartAnnouncementSerializer
    permission_classes = [ReadOnlyOrEditor]

    def get_queryset(self):
        qs = SmartAnnouncement.objects.all()
        u = self.request.user
        if u.is_authenticated and (u.is_editor or u.is_admin):
            return qs
        now = timezone.now()
        return qs.filter(is_active=True, starts_at__lte=now).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=now)
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PatientTopicViewSet(viewsets.ModelViewSet):
    """بوابة توعية المرضى — قراءة للجميع، إدارة للمشرف/المدير."""
    serializer_class = PatientTopicSerializer
    permission_classes = [ReadOnlyOrEditor]
    filterset_fields = ["kind"]

    def get_queryset(self):
        qs = PatientTopic.objects.all()
        u = self.request.user
        if u.is_authenticated and (u.is_editor or u.is_admin):
            return qs
        return qs.filter(is_active=True)


class ContactMessageViewSet(viewsets.ModelViewSet):
    """رسائل التواصل — الإرسال متاح للجميع، والقراءة/الإدارة للمشرف/المدير."""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [IsEditorOrAdmin()]

    @action(detail=True, methods=["post"], permission_classes=[IsEditorOrAdmin])
    def mark_read(self, request, pk=None):
        msg = self.get_object()
        msg.is_read = True
        msg.save(update_fields=["is_read"])
        return Response({"detail": "تم وضع علامة مقروءة."})


class SiteSettingsView(generics.RetrieveUpdateAPIView):
    """إعدادات الموقع (singleton): قراءة للجميع، تعديل للمشرف/المدير."""
    serializer_class = SiteSettingsSerializer
    permission_classes = [ReadOnlyOrEditor]

    def get_object(self):
        return SiteSettings.load()
