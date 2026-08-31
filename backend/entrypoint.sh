#!/usr/bin/env bash
# ============================================================
#  نقطة انطلاق حاوية الخلفية: انتظار قاعدة البيانات ثم الهجرات
#  ثم تجميع الملفات الثابتة ثم تشغيل الخادم.
# ============================================================
set -e

# 1) انتظار قاعدة البيانات (ما لم نكن على SQLite)
if [ "${USE_SQLITE:-False}" != "True" ]; then
  echo "⏳ في انتظار قاعدة البيانات على ${DB_HOST:-db}:${DB_PORT:-5432} ..."
  until nc -z "${DB_HOST:-db}" "${DB_PORT:-5432}"; do
    sleep 1
  done
  echo "✅ قاعدة البيانات جاهزة."
fi

# 2) تطبيق الهجرات
echo "▶ تطبيق الهجرات (migrate) ..."
python manage.py migrate --noinput

# 3) تجميع الملفات الثابتة (لخدمتها عبر WhiteNoise)
echo "▶ تجميع الملفات الثابتة (collectstatic) ..."
python manage.py collectstatic --noinput

# 4) إنشاء حساب مدير أولي إن حُدِّدت متغيّراته (يُتجاهَل إن كان موجوداً)
if [ -n "${DJANGO_SUPERUSER_EMAIL:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  echo "▶ التحقق من حساب المدير الأولي ..."
  if python manage.py createsuperuser --noinput 2>/dev/null; then
    echo "✅ تم إنشاء حساب المدير الأولي."
  else
    echo "ℹ حساب المدير موجود مسبقاً (أو نقص متغيّر DJANGO_SUPERUSER_FULL_NAME) — تم التجاهل."
  fi
fi

# 5) تشغيل الخادم (الأمر القادم من CMD)
echo "🚀 تشغيل الخادم ..."
exec "$@"
