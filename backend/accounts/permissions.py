"""
صلاحيات مخصّصة قابلة لإعادة الاستخدام في كل التطبيقات.
القاعدة العامة: القراءة متاحة للجميع (زوّار)، والكتابة حسب الدور.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """مدير النظام فقط."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)


class IsEditorOrAdmin(permissions.BasePermission):
    """المشرف العلمي أو مدير النظام."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_editor or u.is_admin))


class IsApprovedDoctor(permissions.BasePermission):
    """طبيب منتسب معتمد من الإدارة."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_doctor and u.is_approved)


class ReadOnlyOrEditor(permissions.BasePermission):
    """
    القراءة (GET/HEAD/OPTIONS) متاحة للجميع.
    التعديل متاح للمشرف أو المدير فقط.
    تُستخدم لأقسام يديرها المشرفون: الأخبار، الأنشطة، الإعلانات...
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and (u.is_editor or u.is_admin))


class ReadOnlyOrAdmin(permissions.BasePermission):
    """القراءة للجميع، والتعديل للمدير فقط (مثل مجلس الإدارة)."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        return bool(u and u.is_authenticated and u.is_admin)


class IsAuthorOrStaffOrReadOnly(permissions.BasePermission):
    """
    القراءة للجميع.
    التعديل/الحذف: لصاحب المحتوى (الطبيب) أو للمشرف/المدير.
    تُستخدم لموارد المكتبة التي يرفعها الأطباء.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        u = request.user
        if u.is_editor or u.is_admin:
            return True
        # صاحب المحتوى فقط
        return getattr(obj, "author_id", None) == u.id
