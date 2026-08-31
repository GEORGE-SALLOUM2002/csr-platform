"""
نقل ملفات وثائق الاعتماد الموجودة مسبقاً من الوسائط العامة (media/credentials)
إلى التخزين الخاص (private_media/credentials).

- آمنة على التثبيت الجديد: إن لم يوجد المجلد القديم فهي عملية لا شيء (no-op).
- لا تُغيّر أسماء الملفات في قاعدة البيانات (المسار النسبي "credentials/..." يبقى كما هو،
  ويتغيّر مجلّد الجذر فقط عبر إعداد التخزين).
"""
import os
import shutil

from django.conf import settings
from django.db import migrations


def move_to_private(apps, schema_editor):
    old_dir = os.path.join(settings.MEDIA_ROOT, "credentials")
    new_dir = os.path.join(str(settings.PRIVATE_MEDIA_ROOT), "credentials")
    if not os.path.isdir(old_dir):
        return
    os.makedirs(new_dir, exist_ok=True)
    for name in os.listdir(old_dir):
        src = os.path.join(old_dir, name)
        dst = os.path.join(new_dir, name)
        if os.path.isfile(src) and not os.path.exists(dst):
            shutil.move(src, dst)


def noop_reverse(apps, schema_editor):
    # لا نُعيد الملفات تلقائياً عند التراجع (نتجنّب فقدانها).
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_doctorcredential_file"),
    ]

    operations = [
        migrations.RunPython(move_to_private, noop_reverse),
    ]
