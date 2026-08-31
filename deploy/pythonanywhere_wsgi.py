# ============================================================
#  ملف WSGI لـ PythonAnywhere — جمعية الأشعة
#  انسخ محتواه كاملاً إلى ملف WSGI الخاص بتطبيقك:
#     /var/www/USERNAME_pythonanywhere_com_wsgi.py
#  (احذف كل محتوى الملف الأصلي واستبدله بهذا) ثم استبدل USERNAME
#  باسم مستخدمك، وعدّل اسم مجلد المستودع إن اختلف عن csr-platform.
# ============================================================
import os
import sys
from pathlib import Path

# مسار مجلد backend داخل المستودع المستنسَخ (بداخله حزمة config)
PROJECT_HOME = "/home/USERNAME/csr-platform/backend"
if PROJECT_HOME not in sys.path:
    sys.path.insert(0, PROJECT_HOME)

# تحميل متغيّرات البيئة من backend/.env
from dotenv import load_dotenv
load_dotenv(Path(PROJECT_HOME) / ".env")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
