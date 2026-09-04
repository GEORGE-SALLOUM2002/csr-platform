"""واجهات المكتبة: التصنيفات + الموارد العلمية مع سير الاعتماد."""
from django.db.models import Q
from django.utils import timezone

from content.models import SiteSettings
from rest_framework import viewsets, permissions, status as http_status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from accounts.permissions import ReadOnlyOrEditor, IsAuthorOrStaffOrReadOnly, IsEditorOrAdmin
from .models import Category, Resource
from .serializers import CategorySerializer, ResourceSerializer, ResourceReviewSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """التصنيفات — قراءة للجميع، تعديل للمشرف/المدير."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrEditor]


class ResourceViewSet(viewsets.ModelViewSet):
    """
    الموارد العلمية.
    - الزائر: يرى المعتمد فقط.
    - الطبيب: يرى المعتمد + موارده هو (بأي حالة).
    - المشرف/المدير: يرى كل شيء (بما فيه بانتظار المراجعة).
    """
    serializer_class = ResourceSerializer
    permission_classes = [IsAuthorOrStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ["category", "resource_type", "status", "author"]
    search_fields = ["title_ar", "title_en", "description_ar", "description_en"]
    ordering_fields = ["created_at", "published_at", "title_ar"]

    def get_queryset(self):
        qs = Resource.objects.select_related("category", "author")
        u = self.request.user
        if not u.is_authenticated:
            return qs.filter(status=Resource.Status.APPROVED)
        if u.is_admin or u.is_editor:
            return qs
        return qs.filter(Q(status=Resource.Status.APPROVED) | Q(author=u))

    def perform_create(self, serializer):
        u = self.request.user
        # الطبيب غير المعتمد لا يستطيع الرفع
        if u.is_doctor and not u.is_approved:
            raise PermissionDenied("حسابك بانتظار اعتماد الإدارة قبل أن تتمكن من رفع محتوى.")
        # المشرف/المدير يُعتمد محتواه مباشرة
        if u.is_admin or u.is_editor:
            serializer.save(author=u, status=Resource.Status.APPROVED, reviewed_by=u)
        else:
            # الطبيب: يخضع لمفتاح «مراجعة المحتوى قبل نشره» في إعدادات الموقع.
            # مُفعّل → بانتظار المراجعة؛ مُعطّل → يُنشَر مباشرةً.
            if SiteSettings.load().require_review:
                serializer.save(author=u, status=Resource.Status.PENDING)
            else:
                serializer.save(
                    author=u,
                    status=Resource.Status.APPROVED,
                    published_at=timezone.now(),
                )

    def perform_destroy(self, instance):
        # حذف الملف المرفوع من التخزين قبل حذف السجل (تنظيف)
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """موارد الطبيب الحالي (صفحة «طلباتي»)."""
        qs = Resource.objects.filter(author=request.user).select_related("category")
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=False, methods=["get"], permission_classes=[IsEditorOrAdmin])
    def pending(self, request):
        """قائمة المحتوى بانتظار المراجعة (لوحة المشرف)."""
        qs = Resource.objects.filter(status=Resource.Status.PENDING).select_related("category", "author")
        page = self.paginate_queryset(qs)
        ser = self.get_serializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=["post"], permission_classes=[IsEditorOrAdmin])
    def review(self, request, pk=None):
        """اعتماد أو رفض مورد (مع سبب الرفض)."""
        resource = self.get_object()
        ser = ResourceReviewSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if ser.validated_data["action"] == "approve":
            resource.approve(request.user)
            msg = "تم اعتماد المحتوى ونشره."
        else:
            resource.reject(request.user, ser.validated_data.get("rejection_reason", ""))
            msg = "تم رفض المحتوى."
        return Response({"detail": msg, "resource": ResourceSerializer(resource, context={"request": request}).data})
