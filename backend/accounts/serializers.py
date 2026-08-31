"""
مُسلسِلات (Serializers) الحسابات: التسجيل، بيانات المستخدم، ملف الطبيب، وتسجيل الدخول (JWT).
"""
from urllib.parse import urlencode

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.signing import TimestampSigner
from django.urls import reverse
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import DoctorProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """بيانات المستخدم الأساسية (تُعاد بعد الدخول وفي /me)."""
    role_display = serializers.CharField(source="get_role_display", read_only=True)
    review_status_display = serializers.CharField(source="get_review_status_display", read_only=True)
    documents = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "role", "role_display",
            "review_status", "review_status_display",
            "is_approved", "is_active", "date_joined", "documents",
        ]
        read_only_fields = ["id", "role", "review_status", "is_approved", "is_active", "date_joined"]

    def get_documents(self, obj):
        """مستندات الإثبات المرفقة (صور/PDF).

        تُخزَّن في مكان خاص لا يُخدَم علناً؛ نُرجِع رابطاً موقّعاً محدود الصلاحية
        إلى واجهة التنزيل المحميّة. هذه الحقول لا تظهر إلا للمدير/المشرف عند
        المراجعة وللطبيب نفسه في /me، فلا يصل الرابط إلا لجهة مخوّلة.
        """
        request = self.context.get("request")
        signer = TimestampSigner()
        result = []
        for c in obj.credentials.all():
            token = signer.sign(str(c.id))
            path = reverse("credential-download", args=[c.id]) + "?" + urlencode({"sig": token})
            url = request.build_absolute_uri(path) if request is not None else path
            result.append({"id": c.id, "file": url, "uploaded_at": c.uploaded_at})
        return result


class RegisterSerializer(serializers.ModelSerializer):
    """تسجيل طبيب جديد مع تعبئة كامل بيانات الملف الشخصي — الحساب (قيد المراجعة) حتى يعتمده المدير."""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="تأكيد كلمة المرور")

    # حقول الملف الشخصي (إلزامية بالعربية، والإنجليزية اختيارية)
    specialty_ar = serializers.CharField(write_only=True)
    specialty_en = serializers.CharField(write_only=True, required=False, allow_blank=True)
    degree_ar = serializers.CharField(write_only=True)
    degree_en = serializers.CharField(write_only=True, required=False, allow_blank=True)
    workplace_ar = serializers.CharField(write_only=True)
    workplace_en = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bio_ar = serializers.CharField(write_only=True)
    bio_en = serializers.CharField(write_only=True, required=False, allow_blank=True)
    phone = serializers.CharField(write_only=True)
    # رابط إثبات اختياري (بديل أو مكمّل لملفات الاعتماد)
    proof_url = serializers.URLField(write_only=True, required=False, allow_blank=True)

    _PROFILE_FIELDS = [
        "specialty_ar", "specialty_en", "degree_ar", "degree_en",
        "workplace_ar", "workplace_en", "bio_ar", "bio_en", "phone", "proof_url",
    ]

    class Meta:
        model = User
        fields = ["email", "full_name", "password", "password2"] + [
            "specialty_ar", "specialty_en", "degree_ar", "degree_en",
            "workplace_ar", "workplace_en", "bio_ar", "bio_en", "phone", "proof_url",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "كلمتا المرور غير متطابقتين."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        profile = {k: validated_data.pop(k, "") for k in self._PROFILE_FIELDS}
        user = User(
            role=User.Role.DOCTOR,   # التسجيل الذاتي دائماً كطبيب
            is_approved=False,       # بانتظار اعتماد المدير
            **validated_data,
        )
        user.set_password(password)
        user.save()
        DoctorProfile.objects.create(user=user, **profile)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """تغيير كلمة المرور للمستخدم الحالي (يتحقق من التطابق وقوة كلمة المرور)."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "كلمتا المرور الجديدتان غير متطابقتين."})
        return attrs


class AdminCreateEditorSerializer(serializers.Serializer):
    """إنشاء حساب مشرف علمي جديد (للمدير فقط): اسم + بريد + كلمة مرور."""
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("هذا البريد الإلكتروني مستخدم بالفعل.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "كلمتا المرور غير متطابقتين."})
        return attrs


class DoctorProfileSerializer(serializers.ModelSerializer):
    """ملف الطبيب — للعرض والتعديل من لوحة الطبيب."""
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            "id", "full_name", "email", "photo",
            "specialty_ar", "specialty_en",
            "degree_ar", "degree_en",
            "workplace_ar", "workplace_en",
            "bio_ar", "bio_en", "phone", "proof_url",
            "updated_at",
        ]
        read_only_fields = ["id", "full_name", "email", "updated_at"]


class DoctorPublicSerializer(serializers.ModelSerializer):
    """بطاقة الطبيب في دليل الأطباء العام (يعرض الأبحاث المنشورة)."""
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    research = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = [
            "id", "full_name", "email", "photo",
            "specialty_ar", "specialty_en",
            "degree_ar", "degree_en",
            "workplace_ar", "workplace_en",
            "bio_ar", "bio_en", "research",
        ]

    def get_research(self, obj):
        # الأبحاث المعتمدة والمنشورة لهذا الطبيب
        from library.models import Resource
        qs = Resource.objects.filter(author=obj.user, status=Resource.Status.APPROVED)
        return [
            {"id": r.id, "title_ar": r.title_ar, "title_en": r.title_en, "type": r.resource_type}
            for r in qs
        ]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """تسجيل الدخول: نضيف بيانات الدور داخل التوكن ونُعيد بيانات المستخدم مع التوكن."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class AdminUserDetailSerializer(UserSerializer):
    """تفاصيل كاملة لطلب الحساب: الملف الشخصي + المستندات + منشورات الطبيب."""
    profile = serializers.SerializerMethodField()
    resources = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["profile", "resources"]

    def get_profile(self, obj):
        p = getattr(obj, "doctor_profile", None)
        if not p:
            return None
        return DoctorProfileSerializer(p, context=self.context).data

    def get_resources(self, obj):
        from library.models import Resource
        qs = Resource.objects.filter(author=obj).order_by("-created_at")
        return [
            {"id": r.id, "title_ar": r.title_ar, "title_en": r.title_en,
             "type": r.resource_type, "status": r.status}
            for r in qs
        ]
