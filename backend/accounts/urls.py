"""مسارات تطبيق الحسابات."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, LoginView, MeView, MyDoctorProfileView,
    DoctorDirectoryViewSet, AdminUserViewSet, CredentialDownloadView,
    ChangePasswordView, PasswordResetRequestView, PasswordResetConfirmView,
)

router = DefaultRouter()
router.register("doctors", DoctorDirectoryViewSet, basename="doctors")          # دليل الأطباء العام
router.register("admin/users", AdminUserViewSet, basename="admin-users")        # إدارة الحسابات (مدير)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/me/profile/", MyDoctorProfileView.as_view(), name="my-profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    # تنزيل وثيقة اعتماد عبر رابط موقّع محدود الصلاحية
    path("credentials/<int:pk>/", CredentialDownloadView.as_view(), name="credential-download"),
    path("", include(router.urls)),
]
