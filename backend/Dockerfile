# ============================================================
#  خلفية جمعية الأشعة — Django + Gunicorn (صورة إنتاجية)
# ============================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# أدوات نظام: netcat لانتظار قاعدة البيانات، curl لفحص الصحة
RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd curl \
    && rm -rf /var/lib/apt/lists/*

# مستخدم غير جذري (أمان)
RUN addgroup --system app && adduser --system --ingroup app app

# تثبيت المتطلبات أولاً (استفادة من طبقات الكاش)
COPY requirements.txt .
RUN pip install -r requirements.txt

# نسخ المشروع
COPY . .

# مجلدات الوسائط والملفات الثابتة + الصلاحيات + جعل entrypoint قابلاً للتنفيذ
RUN mkdir -p /app/media /app/private_media /app/staticfiles \
    && chmod +x entrypoint.sh \
    && chown -R app:app /app

USER app

EXPOSE 8000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "-c", "gunicorn.conf.py"]
