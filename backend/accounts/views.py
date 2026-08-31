"""
واجهات (Views) الحسابات: التسجيل، الدخول، /me، ملف الطبيب، دليل الأطباء، وإدارة الحسابات (للمدير).
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import FileResponse, Http404, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from . import emails
from .models import DoctorProfile, DoctorCredential
from .permissions import IsAdmin, IsEditorOrAdmin
from .serializers import (
    RegisterSerializer, UserSerializer, DoctorProfileSerializer,
    DoctorPublicSerializer, MyTokenObtainPairSerializer, AdminUserDetailSerializer,
    ChangePasswordSerializer, AdminCreateEditorSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """تسجيل طبيب جديد (متاح للجميع) مع إرفاق مستندات إثبات (صور/PDF)."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    # حدود حجم المستندات: 5 ميغابايت للملف الواحد، وامتدادات مسموح بها فقط
    MAX_DOC_SIZE = 5 * 1024 * 1024
    ALLOWED_DOC_TYPES = {
        "image/jpeg", "image/png", "image/webp", "application/pdf",
    }

    def create(self, request, *args, **kwargs):
        # الإثبات: ملفات (صورة/PDF) أو رابط — يجب توفّر أحدهما على الأقل، و٣ ملفات كحد أقصى
        docs = request.FILES.getlist("documents")
        proof_url = (request.data.get("proof_url") or "").strip()
        if len(docs) < 1 and not proof_url:
            return Response(
                {"documents": ["يجب إرفاق مستند إثبات (صورة أو ملف) أو إدخال رابط إثبات على الأقل."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(docs) > 3:
            return Response({"documents": ["يُسمح بحد أقصى ٣ ملفات."]}, status=status.HTTP_400_BAD_REQUEST)
        for f in docs:
            if f.size > self.MAX_DOC_SIZE:
                return Response(
                    {"documents": [f"الملف «{f.name}» يتجاوز الحد الأقصى (٥ ميغابايت)."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if f.content_type not in self.ALLOWED_DOC_TYPES:
                return Response(
                    {"documents": [f"نوع الملف «{f.name}» غير مسموح. المسموح: صور JPG/PNG/WebP أو PDF."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        for f in docs:
            DoctorCredential.objects.create(user=user, file=f)
        # إشعار الطبيب باستلام طلبه (لا يُفشِل الطلب إن تعذّر الإرسال)
        emails.send_registration_received(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """تسجيل الدخول وإرجاع توكن + بيانات المستخدم."""
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class CredentialDownloadView(APIView):
    """تنزيل وثيقة اعتماد طبيب عبر رابط موقّع محدود الصلاحية.

    الوثائق مخزّنة في مكان خاص لا يُخدَم علناً؛ الوصول الوحيد إليها هو عبر هذه
    الواجهة، وبتوقيع صالح فقط (يُولَّد للمدير/المشرف أو للطبيب نفسه). التوقيع
    يغني عن ترويسة المصادقة حتى تعمل الروابط في وسم <a>/<img> مباشرةً.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        sig = request.GET.get("sig", "")
        signer = TimestampSigner()
        try:
            value = signer.unsign(sig, max_age=settings.CREDENTIAL_URL_MAX_AGE)
        except SignatureExpired:
            return HttpResponseForbidden("انتهت صلاحية الرابط. أعد فتح صفحة المراجعة.")
        except BadSignature:
            return HttpResponseForbidden("رابط غير صالح.")
        if value != str(pk):
            return HttpResponseForbidden("رابط غير صالح.")
        cred = get_object_or_404(DoctorCredential, pk=pk)
        try:
            fh = cred.file.open("rb")
        except (FileNotFoundError, ValueError):
            raise Http404("الملف غير موجود.")
        # عرض ضمن المتصفح (inline) لتسهيل المعاينة
        return FileResponse(fh)


class MeView(generics.RetrieveUpdateAPIView):
    """قراءة/تعديل بيانات المستخدم الحالي الأساسية."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class MyDoctorProfileView(generics.RetrieveUpdateAPIView):
    """لوحة الطبيب: قراءة/تعديل ملفه الشخصي (يدعم رفع صورة)."""
    serializer_class = DoctorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        # ينشئ ملفاً إن لم يوجد (احتياطاً)
        profile, _ = DoctorProfile.objects.get_or_create(user=self.request.user)
        return profile


class ChangePasswordView(APIView):
    """تغيير كلمة المرور للمستخدم الحالي — متاح لأي مستخدم مسجّل الدخول."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = ChangePasswordSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(ser.validated_data["old_password"]):
            return Response(
                {"old_password": ["كلمة المرور الحالية غير صحيحة."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(ser.validated_data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "تم تغيير كلمة المرور بنجاح."})


class DoctorDirectoryViewSet(viewsets.ReadOnlyModelViewSet):
    """دليل الأطباء العام — يعرض الأطباء المعتمدين فقط."""
    serializer_class = DoctorPublicSerializer
    permission_classes = [permissions.AllowAny]
    search_fields = ["user__full_name", "specialty_ar", "specialty_en", "workplace_ar"]

    def get_queryset(self):
        return (
            DoctorProfile.objects
            .select_related("user")
            .filter(user__role=User.Role.DOCTOR, user__is_approved=True, user__is_active=True)
            .order_by("user__full_name")
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    """إدارة الحسابات (المدير والمشرف): اعتماد/رفض/تفعيل/إيقاف الأعضاء ومراجعة تفاصيلهم."""
    serializer_class = UserSerializer
    permission_classes = [IsEditorOrAdmin]
    filterset_fields = ["role", "review_status", "is_approved", "is_active"]
    search_fields = ["full_name", "email"]

    def get_queryset(self):
        qs = User.objects.all().prefetch_related("credentials").select_related("doctor_profile").order_by("-date_joined")
        # المشرف يدير حسابات الأطباء فقط؛ المدير يرى الجميع
        if self.request.user.is_editor and not self.request.user.is_admin:
            qs = qs.filter(role=User.Role.DOCTOR)
        return qs

    def get_serializer_class(self):
        # عند فتح تفاصيل حساب: نعرض الملف الشخصي والمنشورات كاملة
        if self.action == "retrieve":
            return AdminUserDetailSerializer
        if self.action == "create_editor":
            return AdminCreateEditorSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """إنشاء الحسابات العام معطّل — لإنشاء مشرف استخدم create_editor، وتسجيل الأطباء عبر التسجيل الذاتي."""
        return Response(
            {"detail": "الإنشاء المباشر غير مسموح. استخدم «إضافة مشرف» لإنشاء حساب مشرف."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=False, methods=["post"], permission_classes=[IsAdmin])
    def create_editor(self, request):
        """إنشاء حساب مشرف علمي جديد (للمدير فقط) — يُنشأ معتمداً ونشطاً مباشرةً."""
        ser = AdminCreateEditorSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = User.objects.create_user(
            email=ser.validated_data["email"],
            password=ser.validated_data["password"],
            full_name=ser.validated_data["full_name"],
            role=User.Role.EDITOR,
            is_approved=True,
            is_active=True,
            review_status=User.ReviewStatus.APPROVED,
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """اعتماد حساب طبيب + إشعاره بالبريد."""
        user = self.get_object()
        user.review_status = User.ReviewStatus.APPROVED
        user.is_approved = True
        user.is_active = True
        user.save(update_fields=["review_status", "is_approved", "is_active"])
        emails.send_account_approved(user)
        return Response({"detail": "تم اعتماد الحساب وإشعار الطبيب بالبريد.", "user": UserSerializer(user).data})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """رفض حساب (يصبح «مرفوض» ويصبح قابلاً للحذف) + إشعار الطبيب (مع سبب اختياري)."""
        user = self.get_object()
        reason = (request.data.get("reason") or "").strip()
        user.review_status = User.ReviewStatus.REJECTED
        user.is_approved = False
        user.save(update_fields=["review_status", "is_approved"])
        emails.send_account_rejected(user, reason)
        return Response({"detail": "تم رفض الحساب وإشعار الطبيب. يمكنك الآن حذفه نهائياً.", "user": UserSerializer(user).data})

    def destroy(self, request, *args, **kwargs):
        """حذف حساب:
        - المشرف العلمي (EDITOR): يحذفه المدير فقط، مباشرةً.
        - الطبيب (DOCTOR): بعد رفض طلبه فقط.
        - لا حذف للنفس ولا لحسابات المديرين/الحسابات الخارقة.
        """
        user = self.get_object()
        if user == request.user:
            return Response({"detail": "لا يمكنك حذف حسابك."}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser or user.role == User.Role.ADMIN:
            return Response({"detail": "لا يمكن حذف حسابات المديرين."}, status=status.HTTP_400_BAD_REQUEST)

        # حذف مشرف علمي — متاح لمدير النظام فقط
        if user.role == User.Role.EDITOR:
            if not request.user.is_admin:
                return Response(
                    {"detail": "حذف المشرفين متاح لمدير النظام فقط."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            name = user.full_name
            user.delete()
            return Response({"detail": f"تم حذف المشرف «{name}» نهائياً."}, status=status.HTTP_200_OK)

        # ما تبقّى: حسابات الأطباء — لا تُحذف إلا بعد الرفض
        if user.role != User.Role.DOCTOR:
            return Response({"detail": "لا يمكن حذف هذا النوع من الحسابات."}, status=status.HTTP_400_BAD_REQUEST)
        if user.review_status != User.ReviewStatus.REJECTED:
            return Response(
                {"detail": "لا يمكن الحذف إلا بعد رفض الطلب. ارفض الحساب أولاً ثم احذفه."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # حذف ملفات الاعتماد الحسّاسة من التخزين قبل حذف الحساب (خصوصية)
        for cred in user.credentials.all():
            cred.file.delete(save=False)
        name = user.full_name
        user.delete()
        return Response({"detail": f"تم حذف حساب «{name}» نهائياً."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """إيقاف/تفعيل حساب."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        state = "مُفعّل" if user.is_active else "موقوف"
        return Response({"detail": f"الحساب الآن {state}.", "user": UserSerializer(user).data})
