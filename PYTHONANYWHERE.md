# نشر منصّة جمعية الأشعة على PythonAnywhere (مجانًا) — خطوة بخطوة

هذا الدليل يشرح كيفية رفع الموقع كاملًا (الواجهة + الـ API + لوحة التحكم) على **PythonAnywhere**
المجاني، برابط واحد تُرسله للعميل لتجربته:  `https://USERNAME.pythonanywhere.com`

> **الفكرة:** Django يخدم كل شيء بخدمة واحدة — واجهة React المبنية (عبر WhiteNoise) والـ API
> ولوحة التحكم — فلا حاجة لخادمين ولا لإعداد CORS. قاعدة البيانات SQLite والصور المرفوعة
> تبقى محفوظة لأن قرص PythonAnywhere دائم.

استبدل في كل الأوامر `USERNAME` باسم مستخدمك في PythonAnywhere.

---

## المتطلبات

- حساب **GitHub** (مجاني).
- حساب **PythonAnywhere** مجاني (نوع Beginner) — سجّل من: https://www.pythonanywhere.com
- Git مثبّت على حاسبك (للرفع إلى GitHub).

---

## الجزء ١: رفع المشروع إلى GitHub

1. أنشئ مستودعًا فارغًا جديدًا على GitHub باسم `csr-platform` (بدون README).

2. على حاسبك، افتح موجّه الأوامر داخل مجلد المشروع الذي يحوي `backend` و`frontend`:
   `D:\CSR Project\csr-platform\csr-platform`

3. نفّذ (استبدل `USERNAME` باسمك على GitHub):

   ```bash
   git init
   git add .
   git commit -m "CSR platform - deploy"
   git branch -M main
   git remote add origin https://github.com/USERNAME/csr-platform.git
   git push -u origin main
   ```

> ملاحظة مهمّة: نسخة الواجهة المبنية `frontend/dist` مضمّنة في المستودع عمدًا (لأن الحساب
> المجاني لا يبني الواجهة). تأكّد أنها موجودة قبل الرفع — وهي موجودة أصلًا في مشروعك.
> ملف `backend/.env` (الأسرار) لا يُرفع، وهذا مقصود.

---

## الجزء ٢: تجهيز الخادم (Bash console في PythonAnywhere)

من لوحة PythonAnywhere: افتح **Consoles → Bash**، ثم:

```bash
# 1) استنسخ مشروعك (استبدل USERNAME)
git clone https://github.com/USERNAME/csr-platform.git
cd csr-platform

# 2) أنشئ بيئة افتراضية بايثون 3.11 (تُفعّل تلقائيًا)
mkvirtualenv --python=/usr/bin/python3.11 csr

# 3) ثبّت المكتبات
pip install -r backend/requirements.txt

# 4) جهّز ملف الإعدادات ثم عدّله
cp backend/.env.pythonanywhere.example backend/.env
nano backend/.env
```

في المحرّر `nano` عدّل قيمتين:
- `SECRET_KEY=` ضع مفتاحًا طويلًا عشوائيًا. ولّده بأمر منفصل:
  `python3 -c "import secrets; print(secrets.token_urlsafe(64))"`
- استبدل `USERNAME` في سطري `ALLOWED_HOSTS` و`CSRF_TRUSTED_ORIGINS` و`SITE_URL`.

احفظ الملف (في nano: `Ctrl+O` ثم `Enter` ثم `Ctrl+X`).

```bash
# 5) هيّئ قاعدة البيانات واجمع الملفات الثابتة
cd backend
python manage.py migrate
python manage.py collectstatic --noinput

# 6) أنشئ حساب المدير الأول (تُدخل بريدًا وكلمة مرور من اختيارك)
python manage.py createsuperuser
```

> هذا الحساب يُنشأ بدور «مدير النظام»، ومنه لاحقًا تنشئ المشرفين من داخل الموقع.

---

## الجزء ٣: إعداد تطبيق الويب (تبويب Web)

1. من الأعلى افتح تبويب **Web → Add a new web app**.
2. اختر **Manual configuration** (مهم — ليس «Django»)، ثم **Python 3.11**، ثم Next.
3. بعد الإنشاء، اضبط الأقسام التالية في صفحة التطبيق:

   **Virtualenv:**
   اكتب مسار البيئة:  `/home/USERNAME/.virtualenvs/csr`

   **Code (المصدر ومجلد العمل):**
   - Source code:        `/home/USERNAME/csr-platform/backend`
   - Working directory:  `/home/USERNAME/csr-platform/backend`

   **WSGI configuration file:** اضغط على الرابط لفتح الملف، ثم **احذف محتواه كاملًا**
   والصق محتوى الملف `deploy/pythonanywhere_wsgi.py` من مشروعك (استبدل `USERNAME`
   واسم المجلد إن اختلف). احفظ.

4. **Force HTTPS:** فعّله (Enabled) من قسم Security.

5. اضغط الزر الأخضر الكبير **Reload**.

> **الملفات الثابتة:** لا حاجة لإضافة أي Static files mapping — إذ يخدمها WhiteNoise تلقائيًا
> (الواجهة، `/assets/`، الشعار، وثوابت لوحة الأدمن). هذا مُختبَر ويعمل.

---

## الجزء ٤: التجربة وإرسال الرابط

افتح: `https://USERNAME.pythonanywhere.com`

- الصفحة الرئيسية والموقع كامل يجب أن يظهرا.
- لوحة أدمن Django على `/admin` (ادخل بحساب المدير).
- سجّل الدخول من الموقع بحساب المدير، ثم من **لوحة التحكم** أنشئ المشرفين وأضِف المحتوى.

بعد التأكد، أرسل الرابط للعميل: `https://USERNAME.pythonanywhere.com`

---

## الجزء ٥: التحديثات لاحقًا

على حاسبك، بعد أي تعديل (وإن غيّرت الواجهة أعد بناءها `npm run build` داخل `frontend`):

```bash
git add .
git commit -m "تحديث"
git push
```

على PythonAnywhere (Bash console):

```bash
cd ~/csr-platform && git pull
workon csr && cd backend
python manage.py migrate            # عند تغيّر قاعدة البيانات
python manage.py collectstatic --noinput
```

ثم من تبويب **Web** اضغط **Reload**.

---

## ملاحظات وحدود الخطة المجانية

- تطبيق ويب واحد، ونطاق ثابت `USERNAME.pythonanywhere.com`. متاح طوال اليوم (لا «ينام»).
- الحساب المجاني يحتاج ضغطة **"Run until 3 months from today"** كل ٣ أشهر لإبقاء التطبيق يعمل
  (يظهر تنبيه في تبويب Web).
- قاعدة SQLite والصور المرفوعة تبقى محفوظة (قرص دائم) — ممتاز للتجربة.
- **البريد معطّل** ويُطبَع في السجل فقط؛ تفعيل SMTP الحقيقي يتطلّب حسابًا مدفوعًا (المجاني
  يقيّد الاتصالات الخارجية). لا يؤثّر ذلك على تجربة الموقع.
- حجم القرص المجاني ٥١٢ ميغابايت — كافٍ لهذا المشروع.

---

## استكشاف الأخطاء

| العَرَض | الحل |
|---|---|
| صفحة خطأ عند الفتح | راجع **Error log** في تبويب Web (رابط أسفل الصفحة). |
| `DisallowedHost` | تأكّد أن `ALLOWED_HOSTS` في `backend/.env` = `USERNAME.pythonanywhere.com`. |
| `SECRET_KEY غير آمن` عند الإقلاع | ضع مفتاحًا طوله ٣٢+ حرفًا في `backend/.env`. |
| خطأ 400 عند دخول لوحة الأدمن | تأكّد أن `CSRF_TRUSTED_ORIGINS=https://USERNAME.pythonanywhere.com`. |
| صفحة بيضاء / لا تظهر الواجهة | تأكّد أن `frontend/dist` مرفوع في GitHub وموجود على الخادم، ثم اضغط Reload. |
| تعديلات لا تظهر | نفّذت Reload؟ وربما تحتاج `git pull` على الخادم أولًا. |
| ثوابت لوحة الأدمن بلا تنسيق | تأكّد من تنفيذ `collectstatic` داخل مجلد `backend` مع تفعيل البيئة (`workon csr`). |

---

تمّت تهيئة المشروع مسبقًا لهذا النمط من النشر: `WHITENOISE_ROOT` يخدم الواجهة، وتُعيد Django
ملف `index.html` لأي مسار تطبيقي، وعنوان الـ API في الإنتاج هو `/api` على نفس النطاق.
