"""
أمر بذر بيانات تجريبية تطابق النموذج الأولي.
التشغيل:  python manage.py seed_demo
الأمر آمن للتكرار (لا يُنشئ نسخاً مكررة).

حسابات تجريبية (كلمة المرور للجميع: Csr@12345):
  - مدير النظام:  admin@csr.org
  - مشرف علمي:    editor@csr.org
  - أطباء معتمدون: nour@csr.org, majed@csr.org, hiba@csr.org, wassim@csr.org
  - طبيب قيد المراجعة: pending@csr.org
"""
from datetime import timedelta, date
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from accounts.models import DoctorProfile
from library.models import Category, Resource
from content.models import (
    News, Activity, BoardMember, SmartAnnouncement, PatientTopic, ContactMessage,
)

User = get_user_model()
PW = "Csr@12345"


class Command(BaseCommand):
    help = "بذر بيانات تجريبية للموقع"

    def _user(self, email, name, role, approved=True):
        u, created = User.objects.get_or_create(
            email=email, defaults={"full_name": name, "role": role, "is_approved": approved}
        )
        if created:
            u.set_password(PW)
            if role == User.Role.ADMIN:
                u.is_staff = True
                u.is_superuser = True
            u.save()
        return u

    def handle(self, *args, **options):
        now = timezone.now()

        # ---------------- المستخدمون ----------------
        self._user("admin@csr.org", "مدير النظام", User.Role.ADMIN)
        self._user("editor@csr.org", "المشرف العلمي", User.Role.EDITOR)

        doctors_data = [
            ("nour@csr.org", "د. نور العلي", "أشعة تشخيصية", "Diagnostic Radiology", "بروفيسور", "Professor", "مشفى الجامعة"),
            ("majed@csr.org", "د. ماجد سالم", "أشعة تداخلية", "Interventional Radiology", "أستاذ مشارك", "Assoc. Prof.", "المشفى الوطني"),
            ("hiba@csr.org", "د. هبة كمال", "تصوير مقطعي", "CT Imaging", "اختصاصية", "Specialist", "مركز الأشعة"),
            ("wassim@csr.org", "د. وسيم درويش", "رنين مغناطيسي", "MRI", "استشاري", "Consultant", "مشفى الأمل"),
        ]
        doctors = {}
        for email, name, sar, sen, dar, den, work in doctors_data:
            u = self._user(email, name, User.Role.DOCTOR, approved=True)
            prof, _ = DoctorProfile.objects.get_or_create(user=u)
            prof.specialty_ar, prof.specialty_en = sar, sen
            prof.degree_ar, prof.degree_en = dar, den
            prof.workplace_ar, prof.workplace_en = work, "University Hospital"
            prof.bio_ar = "طبيب أشعة عضو في الجمعية، مهتم بالبحث العلمي والتطوير المهني."
            prof.bio_en = "A radiologist and association member interested in research and professional development."
            prof.save()
            doctors[email] = u

        # طبيب قيد المراجعة (لتجربة اعتماد المدير)
        pending = self._user("pending@csr.org", "د. طبيب جديد", User.Role.DOCTOR, approved=False)
        DoctorProfile.objects.get_or_create(user=pending)

        # ---------------- التصنيفات ----------------
        cats = {}
        for i, (ar, en) in enumerate([
            ("أشعة تشخيصية", "Diagnostic"), ("أشعة تداخلية", "Interventional"),
            ("سلامة إشعاعية", "Radiation Safety"), ("الذكاء الاصطناعي", "AI in Imaging"),
        ]):
            c, _ = Category.objects.get_or_create(name_ar=ar, defaults={"name_en": en, "order": i})
            cats[ar] = c

        # ---------------- المكتبة ----------------
        papers = [
            ("التصوير بالرنين المغناطيسي في تشخيص أورام الدماغ", "MRI in the diagnosis of brain tumors",
             Resource.Type.RESEARCH, "أشعة تشخيصية", "nour@csr.org"),
            ("بروتوكولات الأمان والسلامة الإشعاعية الحديثة", "Modern radiation safety protocols",
             Resource.Type.LECTURE, "سلامة إشعاعية", "majed@csr.org"),
            ("الذكاء الاصطناعي في قراءة صور الأشعة", "Artificial intelligence in reading radiology images",
             Resource.Type.ARTICLE, "الذكاء الاصطناعي", "hiba@csr.org"),
            ("التصوير التداخلي: مبادئ وتطبيقات", "Interventional imaging: principles and applications",
             Resource.Type.RESEARCH, "أشعة تداخلية", "majed@csr.org"),
        ]
        for tar, ten, rtype, cat, author_email in papers:
            Resource.objects.get_or_create(
                title_ar=tar,
                defaults={
                    "title_en": ten, "resource_type": rtype, "category": cats.get(cat),
                    "author": doctors[author_email], "status": Resource.Status.APPROVED,
                    "reviewed_by": User.objects.get(email="editor@csr.org"),
                    "published_at": now, "description_ar": "ملخّص علمي للمورد.",
                    "description_en": "Scientific abstract of the resource.",
                },
            )
        # مورد بانتظار المراجعة (لتجربة لوحة المشرف)
        Resource.objects.get_or_create(
            title_ar="دراسة حالة: تصوير الصدر بالأشعة المقطعية",
            defaults={
                "title_en": "Case study: chest CT imaging", "resource_type": Resource.Type.RESEARCH,
                "category": cats.get("أشعة تشخيصية"), "author": doctors["nour@csr.org"],
                "status": Resource.Status.PENDING,
            },
        )

        # ---------------- الأخبار ----------------
        news = [
            ("توقيع اتفاقية تعاون علمي مع كلية الطب البشري", "Scientific cooperation agreement with the Faculty of Medicine"),
            ("فتح باب التسجيل في المؤتمر السنوي الثامن للأشعة", "Registration open for the 8th Annual Radiology Conference"),
            ("إضافة ٣٢ بحثًا ومحاضرة جديدة إلى المكتبة الإلكترونية", "32 new papers and lectures added to the library"),
            ("ورشة عمل حول التصوير التداخلي للأطباء المنتسبين", "Interventional imaging workshop for members"),
        ]
        for i, (tar, ten) in enumerate(news):
            News.objects.get_or_create(
                title_ar=tar,
                defaults={
                    "title_en": ten, "is_published": True,
                    "publish_at": now - timedelta(days=i * 3),
                    "body_ar": "تفاصيل الخبر الكاملة تُضاف من لوحة المشرف.",
                    "body_en": "Full news details are added from the editor dashboard.",
                },
            )

        # ---------------- الأنشطة ----------------
        activities = [
            ("المؤتمر السنوي الثامن للأشعة", "8th Annual Radiology Conference", Activity.Category.CONFERENCE,
             date(2026, 10, 12), "دمشق", "Damascus"),
            ("ورشة عمل: التصوير التداخلي", "Workshop: Interventional Imaging", Activity.Category.WORKSHOP,
             date(2026, 7, 20), "حلب", "Aleppo"),
            ("ندوة: السلامة الإشعاعية للأطفال", "Seminar: Pediatric Radiation Safety", Activity.Category.SEMINAR,
             date(2026, 5, 9), "اللاذقية", "Latakia"),
        ]
        for tar, ten, cat, d, lar, len_ in activities:
            Activity.objects.get_or_create(
                title_ar=tar,
                defaults={
                    "title_en": ten, "category": cat, "date": d,
                    "location_ar": lar, "location_en": len_,
                    "description_ar": "وصف تفصيلي للنشاط يُضاف من لوحة المشرف.",
                    "description_en": "A detailed description added from the editor dashboard.",
                },
            )

        # ---------------- مجلس الإدارة ----------------
        board = [
            ("د. أحمد المصري", "Dr. Ahmad Al-Masri", "رئيس الجمعية", "President"),
            ("د. ليلى حدّاد", "Dr. Layla Haddad", "نائب الرئيس", "Vice President"),
            ("د. خالد ناصر", "Dr. Khaled Nasser", "أمين السر", "Secretary"),
            ("د. رنا سليمان", "Dr. Rana Sleiman", "أمين الصندوق", "Treasurer"),
            ("د. عمر يوسف", "Dr. Omar Yousef", "عضو مجلس", "Board Member"),
        ]
        for i, (nar, nen, rar, ren) in enumerate(board):
            BoardMember.objects.get_or_create(
                name_ar=nar, defaults={"name_en": nen, "role_ar": rar, "role_en": ren, "order": i},
            )

        # ---------------- الإعلانات الذكية ----------------
        SmartAnnouncement.objects.get_or_create(
            title_ar="المؤتمر السنوي الثامن للأشعة — ١٢ تشرين الأول ٢٠٢٦، دمشق.",
            defaults={
                "title_en": "8th Annual Radiology Conference — October 12, 2026, Damascus.",
                "link": "/activities", "is_pinned": True, "is_active": True,
                "expires_at": now + timedelta(days=90),
            },
        )

        # ---------------- توعية المرضى ----------------
        topics = [
            ("ما هي الأشعة؟", "What is radiology?", "xray", PatientTopic.Kind.TOPIC),
            ("هل الأشعة آمنة؟", "Is imaging safe?", "shield", PatientTopic.Kind.TOPIC),
            ("كيف أستعدّ للفحص؟", "How to prepare?", "clip", PatientTopic.Kind.TOPIC),
            ("بعد الفحص", "After your exam", "check", PatientTopic.Kind.TOPIC),
            ("هل يسبب التصوير ألمًا؟", "Is imaging painful?", "", PatientTopic.Kind.FAQ),
            ("كم يستغرق الفحص؟", "How long does it take?", "", PatientTopic.Kind.FAQ),
        ]
        for i, (tar, ten, icon, kind) in enumerate(topics):
            PatientTopic.objects.get_or_create(
                title_ar=tar,
                defaults={
                    "title_en": ten, "icon": icon, "kind": kind, "order": i,
                    "body_ar": "محتوى توعوي مبسّط يُضاف من لوحة المشرف.",
                    "body_en": "Simple awareness content added from the editor dashboard.",
                },
            )

        # ---------------- رسالة تواصل تجريبية ----------------
        ContactMessage.objects.get_or_create(
            email="visitor@example.com",
            defaults={"name": "زائر", "message": "استفسار عن كيفية الانتساب للجمعية."},
        )

        self.stdout.write(self.style.SUCCESS("✓ تم بذر البيانات التجريبية بنجاح."))
        self.stdout.write("  حسابات الدخول (كلمة المرور: Csr@12345):")
        self.stdout.write("    admin@csr.org · editor@csr.org · nour@csr.org · pending@csr.org")
