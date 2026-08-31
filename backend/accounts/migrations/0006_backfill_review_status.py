"""
تعبئة حقل review_status للحسابات الموجودة مسبقاً بناءً على is_approved:
- المعتمدون (is_approved=True) → APPROVED
- الباقون → PENDING (القيمة الافتراضية)

ملاحظة: المرفوضون سابقاً كانوا يُخزَّنون كـ is_approved=False (مثل «قيد المراجعة»)
فلا يمكن تمييزهم؛ لذا يُعتبرون «قيد المراجعة» بعد الترقية.
"""
from django.db import migrations


def backfill(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_approved=True).update(review_status="APPROVED")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_doctorprofile_proof_url_user_review_status_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill, noop_reverse),
    ]
