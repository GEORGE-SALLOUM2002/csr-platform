# دليل النشر الإنتاجي — منصّة جمعية الأشعة

هذا الدليل يشرح كيفية نشر المنصّة على خادم إنتاجي باستخدام Docker، خطوةً بخطوة.

---

## 1) نظرة عامة على البنية

```
                    الإنترنت
                       │
                       ▼
              ┌──────────────────┐
              │   Nginx (واجهة)  │  المنفذ 80/443
              │  - يخدم React    │
              │  - /media/       │───────────────┐
              └────────┬─────────┘               │
                       │ /api/ , /admin/ , /static/
                       ▼                          │
              ┌──────────────────┐                │
              │  Django+Gunicorn │                │ حجم مشترك
              │  (backend)       │                │ media_data
              │  - WhiteNoise    │◄───────────────┘
              │  - وثائق خاصّة    │  حجم خاص private_data (الخلفية فقط)
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  PostgreSQL (db) │  حجم pg_data
              └──────────────────┘
```

- **الوسائط العامة** (صور الأطباء، الأغلفة) تُخزَّن في `media_data` ويخدمها Nginx مباشرةً.
- **وثائق اعتماد الأطباء الحسّاسة** تُخزَّن في `private_data` ولا يصل إليها Nginx إطلاقاً؛ تُخدَم فقط عبر رابط موقّع محدود الصلاحية من خلال Django.

---

## 2) المتطلبات

- خادم Linux (Ubuntu 22.04+ مُوصى به) بذاكرة 2GB فأكثر.
- **Docker** و**Docker Compose** (الإصدار v2+).
  ```bash
  # تثبيت Docker على أوبنتو
  curl -fsSL https://get.docker.com | sh
  ```
- اسم نطاق (domain) موجَّه إلى عنوان IP الخادم (لتفعيل HTTPS).

---

## 3) النشر السريع (٥ خطوات)

```bash
# 1) انسخ المشروع إلى الخادم
git clone <رابط-المستودع> csr-platform && cd csr-platform

# 2) جهّز ملف المتغيّرات
cp .env.production.example .env

# 3) ولّد مفتاحاً سرياً وضعه في .env مكان SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# 4) عدّل .env: النطاق، كلمة مرور قاعدة البيانات، بيانات SMTP، حساب المدير
nano .env

# 5) ابنِ وشغّل كل الخدمات
docker compose up -d --build
```

بعد دقيقة تقريباً يكون الموقع متاحاً على `http://<نطاقك>` ولوحة الأدمن على `http://<نطاقك>/admin/`.

> عند أول تشغيل تُطبَّق الهجرات وتُجمَّع الملفات الثابتة ويُنشأ حساب المدير تلقائياً
> (من متغيّرات `DJANGO_SUPERUSER_*`).

---

## 4) المتغيّرات الأساسية في `.env`

| المتغيّر | الشرح |
|---|---|
| `SECRET_KEY` | مفتاح Django السرّي — **إلزامي وطويل عشوائي**. |
| `DEBUG` | يجب أن تبقى `False` في الإنتاج. |
| `ALLOWED_HOSTS` | نطاقات الموقع مفصولة بفواصل، مثل `example.com,www.example.com`. |
| `CSRF_TRUSTED_ORIGINS` | نطاقاتك الكاملة مع `https://` (للوحة الأدمن). |
| `DB_PASSWORD` | كلمة مرور قاعدة البيانات — **إلزامية**. |
| `EMAIL_*` | إعدادات SMTP لإرسال إشعارات الأطباء. |
| `DJANGO_SUPERUSER_*` | حساب المدير الأولي (يُنشأ عند أول تشغيل). |

---

## 5) تفعيل HTTPS (موصى به بشدّة)

المنصّة جاهزة للعمل خلف HTTPS. أبسط طريقة هي وضع **Caddy** أو **Nginx + Certbot**
على الخادم كطبقة أمامية، أو استخدام مزوّد يوفّر شهادة تلقائياً.

مثال سريع باستخدام Caddy كمُنهٍ لـ TLS أمام الحاوية:

```bash
# ثبّت Caddy على الخادم، ثم في /etc/caddy/Caddyfile:
example.com {
    reverse_proxy localhost:80
}
```

بعد التأكد أن HTTPS يعمل، فعّل الحماية الكاملة في `.env` ثم أعد التشغيل:

```env
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```
```bash
docker compose up -d
```

> ⚠️ لا تُفعّل `SECURE_SSL_REDIRECT=True` قبل أن يعمل HTTPS فعلياً، وإلا دخل الموقع
> في حلقة إعادة توجيه.

---

## 6) النسخ الاحتياطي والاستعادة

**نسخة احتياطية من قاعدة البيانات:**
```bash
docker compose exec -T db pg_dump -U csr_user csr_db > backup_$(date +%F).sql
```

**استعادة:**
```bash
cat backup_2026-01-01.sql | docker compose exec -T db psql -U csr_user -d csr_db
```

**نسخ احتياطي للوسائط والوثائق (الأحجام):**
```bash
docker run --rm -v csr-platform_media_data:/data -v $(pwd):/out alpine \
  tar czf /out/media_backup.tar.gz -C /data .
docker run --rm -v csr-platform_private_data:/data -v $(pwd):/out alpine \
  tar czf /out/private_backup.tar.gz -C /data .
```

> يُنصح بجدولة هذه الأوامر يومياً عبر `cron`، وحفظ النسخ خارج الخادم.

---

## 7) التحديثات

```bash
git pull
docker compose up -d --build
```
الهجرات وتجميع الملفات الثابتة تُنفَّذ تلقائياً عند إعادة التشغيل.

---

## 8) أوامر مفيدة

```bash
# متابعة السجلّات
docker compose logs -f backend
docker compose logs -f frontend

# فتح صدفة داخل الخلفية
docker compose exec backend bash

# إنشاء مدير إضافي يدوياً
docker compose exec backend python manage.py createsuperuser

# تطبيق هجرات يدوياً
docker compose exec backend python manage.py migrate

# إيقاف كل الخدمات
docker compose down

# إيقاف مع حذف الأحجام (يحذف البيانات! احذر)
docker compose down -v
```

---

## 9) استكشاف الأخطاء

| العَرَض | الحل |
|---|---|
| الخلفية لا تُقلع + خطأ `SECRET_KEY` | ضع مفتاحاً طويلاً في `.env` (٣٢+ حرفاً). |
| `DisallowedHost` | أضِف نطاقك إلى `ALLOWED_HOSTS`. |
| لوحة الأدمن بلا تنسيق | تأكّد أن `collectstatic` عمل (يظهر في سجلّ الخلفية عند الإقلاع). |
| صور لا تظهر | تحقّق أن حجم `media_data` مُركّب على الواجهة (`/var/www/media`). |
| رسائل البريد لا تصل | تحقّق من `EMAIL_ENABLED=True` وصحّة بيانات SMTP في السجلّات. |
| 502 مؤقتاً بعد الإقلاع | طبيعي حتى تجهز الخلفية (فحص الصحة)؛ انتظر ~٤٠ ثانية. |

---

## 10) ملاحظات الأمان المطبَّقة

- ✅ وثائق اعتماد الأطباء مخزّنة في مكان خاص لا يُخدَم علناً، وتُفتَح فقط عبر رابط موقّع محدود الصلاحية.
- ✅ `DEBUG=False` إلزامي، ومفتاح سرّي قوي مطلوب، وإلا تُرفَض بداية التشغيل.
- ✅ كوكيز آمنة، ورؤوس أمان (nosniff, X-Frame-Options, Referrer-Policy)، ودعم HSTS/SSL-redirect.
- ✅ تحديد معدّل محاولات تسجيل الدخول (٥/دقيقة) والتسجيل (١٠/ساعة).
- ✅ التحقق من نوع وحجم الملفات المرفوعة (صور/PDF، ٥ ميغابايت كحد أقصى).
- ✅ مستخدم غير جذري داخل حاوية الخلفية.
- ✅ إشعارات بريد تلقائية للطبيب عند استلام الطلب/الاعتماد/الرفض.

> **تحسين اختياري لاحق:** حزمة JavaScript للواجهة كبيرة (~1MB). يمكن تقسيمها لاحقاً
> عبر `dynamic import()` لتحسين سرعة التحميل الأولى — لا يؤثّر على الوظائف.
