"""
====================================================================
 إعدادات مشروع جمعية الأشعة (Django settings)
 كل القيم الحساسة تُقرأ من ملف .env — راجع .env.example
====================================================================
"""
from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

# المسار الأساسي للمشروع
BASE_DIR = Path(__file__).resolve().parent.parent

# تحميل متغيرات البيئة من ملف .env
load_dotenv(BASE_DIR / ".env")


def env_bool(key, default=False):
    """قراءة قيمة منطقية (True/False) من متغيرات البيئة."""
    return os.getenv(key, str(default)).lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    """قراءة قائمة مفصولة بفواصل من متغيرات البيئة."""
    return [x.strip() for x in os.getenv(key, default).split(",") if x.strip()]


# ------------------------- الأساسيات -------------------------
INSECURE_DEFAULT_KEY = "dev-insecure-secret-key-change-me"
SECRET_KEY = os.getenv("SECRET_KEY", INSECURE_DEFAULT_KEY)
DEBUG = env_bool("DEBUG", True)
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")

# حماية إنتاجية: يُمنع تشغيل الإنتاج بمفتاح سري افتراضي أو بدون نطاقات مسموح بها.
if not DEBUG:
    if SECRET_KEY == INSECURE_DEFAULT_KEY or len(SECRET_KEY) < 32:
        raise ImproperlyConfigured(
            "SECRET_KEY غير آمن للإنتاج. ولّد مفتاحاً عشوائياً طويلاً وضعه في متغيّر البيئة SECRET_KEY."
        )
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured(
            "ALLOWED_HOSTS فارغ. حدّد نطاقات موقعك (مثل example.com) في متغيّر البيئة ALLOWED_HOSTS."
        )

# ------------------------- التطبيقات -------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # مكتبات خارجية
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",

    # تطبيقات المشروع
    "accounts",
    "library",
    "content",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",          # يجب أن يكون في الأعلى
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",     # خدمة الملفات الثابتة في الإنتاج
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ------------------------- قاعدة البيانات -------------------------
# PostgreSQL افتراضياً. لتجربة سريعة اجعل USE_SQLITE=True في ملف .env
if env_bool("USE_SQLITE", False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "csr_db"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
        }
    }

# ------------------------- المستخدم المخصّص -------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------- اللغة والتوقيت -------------------------
LANGUAGE_CODE = "ar"
TIME_ZONE = "Asia/Damascus"
USE_I18N = True
USE_TZ = True

# ------------------------- الملفات الثابتة والوسائط -------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# الوسائط العامة (صور الأطباء، أغلفة الأنشطة...) — تُخدَم مباشرة
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# الوسائط الخاصّة (وثائق اعتماد الأطباء) — لا تُخدَم أبداً بشكل مباشر،
# بل عبر واجهة تنزيل تتحقّق من التوقيع/الصلاحية. تُخزَّن خارج MEDIA_ROOT.
PRIVATE_MEDIA_ROOT = Path(os.getenv("PRIVATE_MEDIA_ROOT", str(BASE_DIR / "private_media")))

# مدّة صلاحية رابط تنزيل الوثيقة (بالثواني) — افتراضياً ساعة واحدة
CREDENTIAL_URL_MAX_AGE = int(os.getenv("CREDENTIAL_URL_MAX_AGE", "3600"))

# ------------------------- التخزين (Django 5 STORAGES) -------------------------
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # تخزين خاص للوثائق الحسّاسة — يرفض إنتاج أي رابط عام
    "private": {
        "BACKEND": "accounts.storage.PrivateMediaStorage",
        "OPTIONS": {"location": str(PRIVATE_MEDIA_ROOT)},
    },
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
# في الإنتاج فقط: نستخدم WhiteNoise (ضغط + بصمة تخزين مؤقت) — يتطلّب collectstatic
if not DEBUG:
    STORAGES["staticfiles"]["BACKEND"] = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ------------------------- خدمة واجهة React (نشر بخدمة واحدة) -------------------------
# مجلد بناء الواجهة (frontend/dist). عند وجوده يخدم WhiteNoise ملفاته على الجذر
# مباشرةً (‎/assets/‎ والشعار وأيقونات...)، وتُعيد Django ملف index.html لأي مسار
# تطبيقي (توجيه SPA من طرف العميل). هذا يتيح نشر الموقع كخدمة واحدة برابط واحد.
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    WHITENOISE_ROOT = str(FRONTEND_DIST)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------- إعدادات DRF -------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    # تحديد المعدّل: نُطبّق حدوداً صارمة على نقاط الدخول/التسجيل فقط (تُضبط في الواجهات)
    "DEFAULT_THROTTLE_RATES": {
        "login": os.getenv("THROTTLE_LOGIN", "5/min"),
        "register": os.getenv("THROTTLE_REGISTER", "10/hour"),
    },
}

# ------------------------- إعدادات JWT -------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# ------------------------- إعدادات CORS -------------------------
# نسمح لواجهة React بالاتصال بالـ API. في الإنتاج يكون الموقع والـ API على نفس
# النطاق (عبر Nginx) فلا حاجة لـ CORS عادةً، لكن يبقى قابلاً للضبط عبر البيئة.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "") or [
    FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

# أثناء التطوير فقط: اسمح لأي منفذ محلي (يمنع مشاكل CORS مع منافذ Vite المختلفة)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True

# ------------------------- تعزيزات الأمان (الإنتاج) -------------------------
# نثق برأس البروكسي (Nginx) في تحديد إن كان الاتصال عبر HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

# نطاقات موثوقة لطلبات POST الآمنة (لوحة أدمن Django عبر HTTPS)
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")

# رؤوس أمان عامة (آمنة في كل الأوضاع)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# إعادة التوجيه إلى HTTPS + كوكيز آمنة + HSTS — تُفعَّل بعد تجهيز شهادة TLS.
# تبقى قابلة للضبط بالبيئة حتى لا تُقفل الموقع قبل توفّر HTTPS.
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)
SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE", not DEBUG)
CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE", not DEBUG)
SESSION_COOKIE_HTTPONLY = True
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", True)

# ------------------------- البريد الإلكتروني -------------------------
# في التطوير تُطبع الرسائل في الطرفية (console). في الإنتاج يُستخدم SMTP.
EMAIL_ENABLED = env_bool("EMAIL_ENABLED", False)
if EMAIL_ENABLED:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "جمعية الأشعة <no-reply@example.org>")
SERVER_EMAIL = os.getenv("SERVER_EMAIL", DEFAULT_FROM_EMAIL)

# اسم الموقع ورابطه (يُستخدمان في نصوص الرسائل)
SITE_NAME = os.getenv("SITE_NAME", "جمعية الأشعة")
SITE_URL = os.getenv("SITE_URL", FRONTEND_URL)

# ------------------------- السجلّات (Logging) -------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "[{asctime}] {levelname} {name}: {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": LOG_LEVEL},
    "loggers": {
        "django": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "csr": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
    },
}
