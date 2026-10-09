"""واجهات المحتوى العام."""
from datetime import timedelta

from django.db.models import F, Q, Sum
from django.utils import timezone
from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from config.throttles import StatsThrottle
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from accounts.permissions import ReadOnlyOrEditor, ReadOnlyOrAdmin, IsEditorOrAdmin, IsAdmin
from library.models import Resource
from .models import (
    News, Activity, ActivityFile, BoardMember,
    SmartAnnouncement, PatientTopic, ContactMessage, SiteSettings, DailyVisit,
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


# ============================ الإحصاءات ============================
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@throttle_classes([StatsThrottle])
def record_visit(request):
    """تسجيل زيارة للموقع (تستدعيها الواجهة مرة واحدة لكل جلسة متصفح)."""
    today = timezone.localdate()
    obj, created = DailyVisit.objects.get_or_create(date=today, defaults={"count": 1})
    if not created:
        DailyVisit.objects.filter(pk=obj.pk).update(count=F("count") + 1)
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAdmin])
def site_stats(request):
    """إحصاءات المدير: الزيارات + مشاهدات الفيديو والضغطات على روابطه."""
    today = timezone.localdate()

    def visits_since(days):
        start = today - timedelta(days=days - 1)
        return DailyVisit.objects.filter(date__gte=start).aggregate(n=Sum("count"))["n"] or 0

    start30 = today - timedelta(days=29)
    by_day = dict(DailyVisit.objects.filter(date__gte=start30).values_list("date", "count"))
    daily = [
        {"date": (start30 + timedelta(days=i)).isoformat(), "count": by_day.get(start30 + timedelta(days=i), 0)}
        for i in range(30)
    ]

    videos = (
        Resource.objects.filter(Q(video_url__gt="") | Q(view_count__gt=0) | Q(click_count__gt=0))
        .select_related("author")
        .order_by("-view_count", "-click_count")[:100]
    )
    totals = Resource.objects.aggregate(views=Sum("view_count"), clicks=Sum("click_count"))
    return Response({
        "visits": {
            "today": visits_since(1),
            "last_7": visits_since(7),
            "last_30": visits_since(30),
            "total": DailyVisit.objects.aggregate(n=Sum("count"))["n"] or 0,
            "daily": daily,
        },
        "videos": {
            "total_views": totals["views"] or 0,
            "total_clicks": totals["clicks"] or 0,
            "items": [
                {
                    "id": r.id, "title_ar": r.title_ar, "title_en": r.title_en,
                    "author_name": r.author.full_name, "status": r.status,
                    "video_url": r.video_url, "has_file": bool(r.file),
                    "view_count": r.view_count, "click_count": r.click_count,
                }
                for r in videos
            ],
        },
        "show_view_counts": SiteSettings.load().show_view_counts,
    })
