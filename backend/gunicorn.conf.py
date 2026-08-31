"""إعدادات Gunicorn لخادم الإنتاج."""
import multiprocessing
import os

# الربط داخل الحاوية (Nginx يمرّر إليه)
bind = "0.0.0.0:8000"

# عدد العمّال والخيوط — قابل للضبط عبر البيئة
workers = int(os.getenv("GUNICORN_WORKERS", (multiprocessing.cpu_count() * 2) + 1))
threads = int(os.getenv("GUNICORN_THREADS", "2"))

# مهلة الطلب (ثوانٍ)
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))

# إعادة تدوير العمّال دورياً (يقاوم تسرّب الذاكرة)
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", "100"))

# السجلّات إلى الإخراج القياسي (يلتقطها Docker)
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOGLEVEL", "info")
