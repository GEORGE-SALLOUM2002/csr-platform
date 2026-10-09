"""واجهات المكتبة: التصنيفات + الموارد العلمية مع سير الاعتماد."""
import mimetypes
import re

from django.conf import settings
from django.core.signing import BadSignature, SignatureExpired
from django.http import FileResponse, Http404, HttpResponse, HttpResponseForbidden, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import F, Q
from django.utils import timezone

from content.models import SiteSettings
from rest_framework import viewsets, permissions, status as http_status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from config.throttles import StatsThrottle

from accounts.permissions import ReadOnlyOrEditor, IsAuthorOrStaffOrReadOnly, IsEditorOrAdmin
from .models import Category, Resource
from .serializers import CategorySerializer, ResourceSerializer, ResourceReviewSerializer, stream_signer

_RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")
_CHUNK = 512 * 1024


def _iter_file(fh, start, length):
    """قراءة جزء من الملف على دفعات ثم إغلاقه."""
    try:
        fh.seek(start)
        remaining = length
        while remaining > 0:
            data = fh.read(min(_CHUNK, remaining))
            if not data:
                break
            remaining -= len(data)
            yield data
    finally:
        fh.close()


def _protect(resp):
    """رؤوس تمنع التخزين والحفظ كمرفق وتمنع تضمين الملف في مواقع أخرى."""
    resp["Content-Disposition"] = "inline"
    resp["Cache-Control"] = "private, no-store, max-age=0"
    resp["X-Content-Type-Options"] = "nosniff"
    resp["Cross-Origin-Resource-Policy"] = "same-origin"
    resp["Accept-Ranges"] = "bytes"
    return resp


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

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.AllowAny],
        throttle_classes=[StatsThrottle],
    )
    def track(self, request, pk=None):
        """تسجيل مشاهدة فيديو (view) أو ضغطة على رابط الفيديو (click) — متاح للجميع."""
        field = {"view": "view_count", "click": "click_count"}.get(request.data.get("event"))
        if not field:
            return Response({"detail": "event يجب أن يكون view أو click."}, status=http_status.HTTP_400_BAD_REQUEST)
        resource = self.get_object()  # يحترم قواعد الظهور (المعتمد فقط للزوار)
        Resource.objects.filter(pk=resource.pk).update(**{field: F(field) + 1})
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny], authentication_classes=[])
    def stream(self, request, pk=None):
        """عرض ملف المورد داخل الموقع فقط (منع التحميل).

        - الملف لا يُخدَم من /media/ إطلاقاً؛ الوصول الوحيد عبر هذا الرابط الموقّع
          محدود الصلاحية (يُولَّد ضمن بيانات المورد لمن يحق له رؤيته).
        - يُرفض فتح الرابط مباشرةً في المتصفح (شريط العنوان/تبويب جديد)؛ يعمل فقط
          من داخل مشغّل الفيديو/الصوت وعارض PDF في صفحات الموقع.
        - يدعم طلبات Range لتقديم/تأخير الفيديو.
        """
        try:
            value = stream_signer().unsign(request.GET.get("sig", ""), max_age=settings.RESOURCE_STREAM_MAX_AGE)
        except SignatureExpired:
            return HttpResponseForbidden("انتهت صلاحية الرابط. أعد تحميل الصفحة.")
        except BadSignature:
            return HttpResponseForbidden("رابط غير صالح.")
        if value != str(pk):
            return HttpResponseForbidden("رابط غير صالح.")
        # فتح الرابط كصفحة مستقلة = محاولة تحميل/حفظ → مرفوض
        if request.headers.get("Sec-Fetch-Dest") == "document":
            return HttpResponseForbidden("هذا المحتوى متاح للعرض داخل الموقع فقط.")

        resource = get_object_or_404(Resource, pk=pk)
        if not resource.file:
            raise Http404("لا يوجد ملف.")
        try:
            size = resource.file.size
            fh = resource.file.open("rb")
        except (FileNotFoundError, OSError, ValueError):
            raise Http404("الملف غير موجود.")
        ctype = mimetypes.guess_type(resource.file.name)[0] or "application/octet-stream"

        m = _RANGE_RE.fullmatch(request.headers.get("Range", "").strip())
        if m and (m.group(1) or m.group(2)):
            if m.group(1):
                start = int(m.group(1))
                end = min(int(m.group(2)), size - 1) if m.group(2) else size - 1
            else:  # bytes=-N (آخر N بايت)
                start = max(0, size - int(m.group(2)))
                end = size - 1
            if start >= size or start > end:
                fh.close()
                resp = HttpResponse(status=416)
                resp["Content-Range"] = f"bytes */{size}"
                return _protect(resp)
            length = end - start + 1
            resp = StreamingHttpResponse(_iter_file(fh, start, length), status=206, content_type=ctype)
            resp["Content-Range"] = f"bytes {start}-{end}/{size}"
            resp["Content-Length"] = str(length)
            return _protect(resp)

        resp = FileResponse(fh, content_type=ctype)
        resp["Content-Length"] = str(size)
        return _protect(resp)
