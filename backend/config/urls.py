"""
المسارات الجذرية للمشروع.
- كل مسارات الـ API تحت البادئة /api/
- لوحة تحكم Django تحت /admin/
- ملفات الوسائط المرفوعة تحت /media/
- أي مسار آخر يعيد واجهة React (index.html) لدعم التوجيه من طرف العميل (SPA).
  الملفات الثابتة للواجهة (/assets/ والشعار...) يخدمها WhiteNoise مباشرةً في الإنتاج.
"""
import posixpath

from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, HttpResponseNotFound, JsonResponse
from django.views.static import serve as static_serve


def media_serve(request, path):
    """يخدم الوسائط العامة، ويرفض ملفات المحتوى العلمي (library/) التي لا تُعرض
    إلا عبر رابط العرض الموقّع /api/resources/<id>/stream/ (منع التحميل)."""
    if posixpath.normpath(path).lstrip("/").startswith("library/"):
        return HttpResponseNotFound()
    return static_serve(request, path, document_root=settings.MEDIA_ROOT)


def spa_index(request, *args, **kwargs):
    """يعيد واجهة React (index.html) لأي مسار غير API/admin — لدعم توجيه SPA."""
    index_file = settings.FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(open(index_file, "rb"), content_type="text/html")
    # لم تُبنَ الواجهة بعد (frontend/dist غير موجود)
    return JsonResponse(
        {
            "app": "جمعية الأشعة API",
            "status": "ok",
            "detail": "الـ API يعمل. لم تُبنَ الواجهة بعد — نفّذ npm run build داخل frontend.",
        },
        json_dumps_params={"ensure_ascii": False},
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("library.urls")),
    path("api/", include("content.urls")),
    # ملفات الوسائط المرفوعة — تعمل في الإنتاج أيضاً (استضافات ذات قرص دائم مثل PythonAnywhere)
    # ملفات المحتوى العلمي (library/) مستثناة: لا تُخدَم إلا عبر /api/resources/<id>/stream/ الموقّع
    re_path(r"^media/(?P<path>.*)$", media_serve),
    # توجيه SPA: أي مسار عدا (api/admin/media/static/assets) يعيد index.html
    re_path(r"^(?!api/|admin/|media/|static/|assets/).*$", spa_index),
]
