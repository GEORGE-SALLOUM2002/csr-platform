# منصّة جمعية الأشعة — تطبيق ويب متكامل

منصّة إلكترونية متكاملة لجمعية الأشعة تجمع: **واجهة تعريفية**، **مكتبة علمية**، **دليل أطباء**، **أخبار ومؤتمرات**، **بوابة توعية للمرضى**، ولوحات تحكم بأربعة أدوار (زائر / طبيب / مشرف علمي / مدير نظام).

المشروع مقسوم إلى جزأين:

| المجلد | التقنية | الوصف |
|--------|---------|-------|
| `backend/` | **Django + Django REST Framework + PostgreSQL** | الـ API والمصادقة وقاعدة البيانات |
| `frontend/` | **React (Vite) + MUI + i18n** | الواجهة (شريط جانبي، ثنائية اللغة عربي/إنجليزي، وضع فاتح/داكن) |

الاتصال بين الطرفين يتم عبر **REST API** مع مصادقة **JWT**.

---

## المتطلبات المسبقة

- **Python** 3.11 أو أحدث
- **Node.js** 18 أو أحدث (مع npm)
- **PostgreSQL** 14 أو أحدث (مثبّت وقيد التشغيل)

---

## أولاً: تشغيل الخلفية (Backend)

```bash
cd backend

# 1) إنشاء بيئة افتراضية وتفعيلها
python -m venv .venv
# على ويندوز:
.venv\Scripts\activate
# على لينكس/ماك:
source .venv/bin/activate

# 2) تثبيت المكتبات
pip install -r requirements.txt

# 3) إنشاء قاعدة بيانات في PostgreSQL (مرة واحدة)
#    افتح psql أو pgAdmin ونفّذ:
#    CREATE DATABASE csr_db;

# 4) إعداد متغيرات البيئة
copy .env.example .env        # ويندوز
# cp .env.example .env        # لينكس/ماك
#    ثم افتح .env وعدّل DB_PASSWORD وبيانات القاعدة حسب جهازك

# 5) إنشاء الجداول
python manage.py migrate

# 6) (اختياري لكن موصى به) بذر بيانات تجريبية تطابق النموذج
python manage.py seed_demo

# 7) إنشاء حساب مدير خاص بك للوحة Django (اختياري)
python manage.py createsuperuser

# 8) تشغيل الخادم
python manage.py runserver
```

الـ API سيعمل على: **http://localhost:8000/**
لوحة تحكم Django (للإدارة المتقدمة): **http://localhost:8000/admin/**

> **بديل سريع بلا PostgreSQL:** لتجربة المشروع فوراً دون تثبيت قاعدة بيانات، اجعل `USE_SQLITE=True` في ملف `.env` — سيستخدم المشروع ملف SQLite محلي. (غيّرها إلى `False` عند الانتقال إلى PostgreSQL).

---

## ثانياً: تشغيل الواجهة (Frontend)

في نافذة طرفية **جديدة**:

```bash
cd frontend

# 1) تثبيت المكتبات
npm install

# 2) إعداد عنوان الـ API (اختياري — القيمة الافتراضية جاهزة)
copy .env.example .env        # ويندوز  (أو cp على لينكس/ماك)

# 3) تشغيل خادم التطوير
npm run dev
```

الواجهة ستعمل على: **http://localhost:5173/**

> يجب أن يكون خادم الخلفية (Django) قيد التشغيل ليعمل الاتصال بالـ API.

لبناء نسخة إنتاجية:
```bash
npm run build      # يُنتج مجلد dist/ جاهز للنشر
```

---

## الحسابات التجريبية

بعد تشغيل `seed_demo`، كلمة المرور لجميع الحسابات: **`Csr@12345`**

| الدور | البريد | يستطيع |
|------|--------|--------|
| مدير النظام | `admin@csr.org` | كل شيء: اعتماد الحسابات، إدارة الأعضاء، كل المحتوى |
| مشرف علمي | `editor@csr.org` | مراجعة/اعتماد المحتوى، إدارة الأخبار والإعلانات |
| طبيب معتمد | `nour@csr.org` | تعديل ملفه، رفع أبحاث، متابعة طلباته |
| طبيب قيد المراجعة | `pending@csr.org` | ينتظر اعتماد المدير قبل الرفع |

---

## الأدوار والصلاحيات

| الدور | لوحة التحكم | الصلاحيات |
|------|-------------|-----------|
| **الزائر** | لا يوجد | تصفّح كل المحتوى المنشور (مكتبة، أطباء، أخبار، مرضى…) |
| **الطبيب** | لوحة شخصية | تعديل بياناته، رفع أبحاث (تُراجَع قبل النشر)، متابعة «طلباتي» |
| **المشرف** | لوحة إشراف | اعتماد/رفض المحتوى العلمي، إدارة الأخبار والإعلانات الذكية |
| **المدير** | لوحة كاملة | كل ما سبق + اعتماد حسابات الأطباء + إدارة الأعضاء ومجلس الإدارة |

---

## أهم نقاط الـ API

جميع المسارات تحت البادئة `/api/`:

```
POST  /api/auth/register/         تسجيل طبيب جديد
POST  /api/auth/login/            تسجيل الدخول (يعيد access + refresh + user)
POST  /api/auth/refresh/          تجديد التوكن
GET   /api/auth/me/               بيانات المستخدم الحالي
GET   /api/auth/me/profile/       ملف الطبيب (تعديل عبر PATCH)

GET   /api/doctors/               دليل الأطباء (المعتمدون)
GET   /api/categories/            تصنيفات المكتبة
GET   /api/resources/             موارد المكتبة (المعتمدة للزائر)
POST  /api/resources/             رفع مورد (طبيب)
GET   /api/resources/mine/        موارد الطبيب الحالي
GET   /api/resources/pending/     قائمة المراجعة (مشرف)
POST  /api/resources/{id}/review/ اعتماد/رفض (مشرف)

GET   /api/news/                  الأخبار
GET   /api/activities/            الأنشطة والمؤتمرات
GET   /api/board/                 مجلس الإدارة
GET   /api/announcements/         الإعلانات الذكية (الفعّالة)
GET   /api/patient-topics/        بوابة توعية المرضى
POST  /api/contact/               إرسال رسالة تواصل
GET   /api/admin/users/           إدارة الحسابات (مدير)
POST  /api/admin/users/{id}/approve/   اعتماد حساب (مدير)
```

---

## كيف أعدّل بسهولة؟

- **ألوان الموقع كلها:** من ملف واحد `frontend/src/theme.js` (عدّل قيم `brand`).
- **نصوص الواجهة (عربي/إنجليزي):** `frontend/src/locales/ar.json` و `en.json`.
- **الأقسام في الشريط الجانبي:** `frontend/src/components/Sidebar.jsx`.
- **حقول قاعدة البيانات:** نماذج Django في `backend/accounts/models.py` و `library/models.py` و `content/models.py` (بعد أي تعديل: `python manage.py makemigrations` ثم `migrate`).
- **البيانات التجريبية:** `backend/content/management/commands/seed_demo.py`.

---

## ملاحظات

- الصور والملفات المرفوعة تُحفظ في `backend/media/` أثناء التطوير.
- كل الحقول النصية ثنائية اللغة (حقلان: `_ar` و `_en`) وتُعرض حسب لغة الواجهة.
- عند النشر للإنتاج: اجعل `DEBUG=False`، واضبط `ALLOWED_HOSTS` و `SECRET_KEY` و `FRONTEND_URL`، واستخدم خادماً مثل Gunicorn + Nginx، ونفّذ `python manage.py collectstatic`.
- هذه **نسخة أولية للتطوير** — الأسماء والبيانات التجريبية تُستبدل ببيانات الجمعية الفعلية من لوحات التحكم.
