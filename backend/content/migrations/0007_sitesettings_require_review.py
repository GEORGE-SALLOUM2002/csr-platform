from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0006_sitesettings"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="require_review",
            field=models.BooleanField(default=True, verbose_name="مراجعة المحتوى العلمي قبل نشره"),
        ),
    ]
