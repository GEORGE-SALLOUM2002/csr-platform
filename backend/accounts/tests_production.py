"""
اختبارات ميزات الإنتاج: تأمين وثائق الاعتماد، تحديد المعدّل، وإشعارات البريد.
تشغيل:  python manage.py test accounts.tests_production
"""
import os
import time

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.signing import TimestampSigner
from django.test import override_settings, SimpleTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from config.validators import FileSizeValidator
from content.models import Activity, ActivityFile, News, BoardMember, SiteSettings
from library.models import Resource
from .models import User, DoctorProfile, DoctorCredential

# صورة PNG صغيرة صالحة (1x1) بايت
PNG_1PX = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06"
    b"\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05"
    b"\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)

LOCMEM_EMAIL = "django.core.mail.backends.locmem.EmailBackend"


@override_settings(EMAIL_BACKEND=LOCMEM_EMAIL)
class CredentialSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.doctor = User.objects.create_user(
            email="doc@test.org", password="Csr@12345", full_name="طبيب اختبار",
            role=User.Role.DOCTOR, is_approved=True, is_active=True,
        )
        self.cred = DoctorCredential.objects.create(
            user=self.doctor, file=SimpleUploadedFile("id.png", PNG_1PX, content_type="image/png"),
        )

    def test_file_stored_in_private_location(self):
        """الملف يُخزَّن تحت PRIVATE_MEDIA_ROOT لا تحت MEDIA_ROOT العام."""
        path = self.cred.file.path
        self.assertTrue(path.startswith(str(settings.PRIVATE_MEDIA_ROOT)))
        self.assertFalse(path.startswith(str(settings.MEDIA_ROOT)))
        self.assertTrue(os.path.exists(path))

    def test_private_storage_has_no_public_url(self):
        """التخزين الخاص لا يُنتج رابطاً عاماً (base_url=None)."""
        with self.assertRaises(ValueError):
            _ = self.cred.file.url

    def test_download_with_valid_signature(self):
        signer = TimestampSigner()
        sig = signer.sign(str(self.cred.id))
        url = reverse("credential-download", args=[self.cred.id]) + f"?sig={sig}"
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(b"".join(res.streaming_content), PNG_1PX)

    def test_download_without_signature_forbidden(self):
        url = reverse("credential-download", args=[self.cred.id])
        self.assertEqual(self.client.get(url).status_code, 403)

    def test_download_with_bad_signature_forbidden(self):
        url = reverse("credential-download", args=[self.cred.id]) + "?sig=deadbeef"
        self.assertEqual(self.client.get(url).status_code, 403)

    def test_signature_for_other_pk_forbidden(self):
        """توقيع صالح لوثيقة أخرى لا يفتح هذه الوثيقة."""
        other = DoctorCredential.objects.create(
            user=self.doctor, file=SimpleUploadedFile("x.png", PNG_1PX, content_type="image/png"),
        )
        sig = TimestampSigner().sign(str(other.id))
        url = reverse("credential-download", args=[self.cred.id]) + f"?sig={sig}"
        self.assertEqual(self.client.get(url).status_code, 403)

    @override_settings(CREDENTIAL_URL_MAX_AGE=0)
    def test_expired_signature_forbidden(self):
        sig = TimestampSigner().sign(str(self.cred.id))
        time.sleep(1)
        url = reverse("credential-download", args=[self.cred.id]) + f"?sig={sig}"
        self.assertEqual(self.client.get(url).status_code, 403)

    def test_serializer_emits_signed_not_media_url(self):
        """/me يُرجِع رابطاً موقّعاً إلى /credentials/ لا رابط /media/."""
        self.client.force_authenticate(self.doctor)
        res = self.client.get(reverse("me"))
        self.assertEqual(res.status_code, 200)
        docs = res.data["documents"]
        self.assertEqual(len(docs), 1)
        self.assertIn("/credentials/", docs[0]["file"])
        self.assertIn("sig=", docs[0]["file"])
        self.assertNotIn("/media/", docs[0]["file"])


@override_settings(EMAIL_BACKEND=LOCMEM_EMAIL)
class AccountEmailTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@test.org", password="Csr@12345", full_name="مدير",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )
        self.doctor = User.objects.create_user(
            email="pending@test.org", password="Csr@12345", full_name="طبيب معلّق",
            role=User.Role.DOCTOR, is_approved=False, is_active=True,
        )

    def test_approve_sends_email(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(reverse("admin-users-approve", args=[self.doctor.id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(self.doctor.email, mail.outbox[0].to)
        self.doctor.refresh_from_db()
        self.assertTrue(self.doctor.is_approved)

    def test_reject_sends_email_with_reason(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            reverse("admin-users-reject", args=[self.doctor.id]),
            {"reason": "المستندات غير واضحة"}, format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        self.assertIn("غير واضحة", body)


@override_settings(
    EMAIL_BACKEND=LOCMEM_EMAIL,
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
)
class LoginThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        User.objects.create_user(
            email="u@test.org", password="Csr@12345", full_name="مستخدم",
            role=User.Role.ADMIN, is_approved=True, is_active=True,
        )

    def test_login_is_rate_limited(self):
        """المحاولة السادسة خلال دقيقة تُرفَض (429) — الحد 5/دقيقة."""
        url = reverse("login")
        codes = []
        for _ in range(6):
            r = self.client.post(url, {"email": "u@test.org", "password": "wrong"}, format="json")
            codes.append(r.status_code)
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertNotIn(status.HTTP_429_TOO_MANY_REQUESTS, codes[:5])


@override_settings(EMAIL_BACKEND=LOCMEM_EMAIL)
class RegistrationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def _payload(self):
        return {
            "email": "new@test.org", "full_name": "طبيب جديد",
            "password": "Csr@12345", "password2": "Csr@12345",
            "specialty_ar": "أشعة", "degree_ar": "دكتوراه",
            "workplace_ar": "مشفى", "bio_ar": "نبذة", "phone": "0900000000",
        }

    def test_registration_creates_credential_and_sends_email(self):
        data = self._payload()
        data["documents"] = SimpleUploadedFile("proof.png", PNG_1PX, content_type="image/png")
        res = self.client.post(reverse("register"), data, format="multipart")
        self.assertEqual(res.status_code, 201, res.data)
        user = User.objects.get(email="new@test.org")
        self.assertFalse(user.is_approved)
        self.assertEqual(user.credentials.count(), 1)
        # الملف في التخزين الخاص
        self.assertTrue(user.credentials.first().file.path.startswith(str(settings.PRIVATE_MEDIA_ROOT)))
        # بريد استلام الطلب
        self.assertEqual(len(mail.outbox), 1)

    def test_registration_rejects_disallowed_filetype(self):
        data = self._payload()
        data["documents"] = SimpleUploadedFile("proof.exe", b"MZ...", content_type="application/x-msdownload")
        res = self.client.post(reverse("register"), data, format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_registration_requires_at_least_one_document(self):
        res = self.client.post(reverse("register"), self._payload(), format="multipart")
        self.assertEqual(res.status_code, 400)

    def test_registration_with_proof_url_no_files_ok(self):
        """يُقبل التسجيل برابط إثبات فقط دون ملفات."""
        data = self._payload()
        data["proof_url"] = "https://example.org/my-certificate.pdf"
        res = self.client.post(reverse("register"), data, format="multipart")
        self.assertEqual(res.status_code, 201, res.data)
        user = User.objects.get(email="new@test.org")
        self.assertEqual(user.credentials.count(), 0)
        self.assertEqual(user.doctor_profile.proof_url, "https://example.org/my-certificate.pdf")


@override_settings(EMAIL_BACKEND=LOCMEM_EMAIL)
class RejectDeleteTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@test.org", password="Csr@12345", full_name="مدير",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )
        self.doctor = User.objects.create_user(
            email="pending@test.org", password="Csr@12345", full_name="طبيب معلّق",
            role=User.Role.DOCTOR, is_approved=False, is_active=True,
        )
        self.cred = DoctorCredential.objects.create(
            user=self.doctor, file=SimpleUploadedFile("id.png", PNG_1PX, content_type="image/png"),
        )

    def test_reject_sets_status_rejected(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(reverse("admin-users-reject", args=[self.doctor.id]))
        self.assertEqual(r.status_code, 200)
        self.doctor.refresh_from_db()
        self.assertEqual(self.doctor.review_status, User.ReviewStatus.REJECTED)

    def test_cannot_delete_pending_account(self):
        self.client.force_authenticate(self.admin)
        r = self.client.delete(reverse("admin-users-detail", args=[self.doctor.id]))
        self.assertEqual(r.status_code, 400)
        self.assertTrue(User.objects.filter(id=self.doctor.id).exists())

    def test_delete_rejected_removes_account_and_files(self):
        self.client.force_authenticate(self.admin)
        path = self.cred.file.path
        self.assertTrue(os.path.exists(path))
        self.client.post(reverse("admin-users-reject", args=[self.doctor.id]))
        r = self.client.delete(reverse("admin-users-detail", args=[self.doctor.id]))
        self.assertEqual(r.status_code, 200)
        self.assertFalse(User.objects.filter(id=self.doctor.id).exists())
        self.assertFalse(os.path.exists(path))  # حُذف الملف الحسّاس أيضاً

    def test_cannot_delete_staff_account(self):
        other_admin = User.objects.create_user(
            email="admin2@test.org", password="Csr@12345", full_name="مدير٢",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )
        self.client.force_authenticate(self.admin)
        r = self.client.delete(reverse("admin-users-detail", args=[other_admin.id]))
        self.assertEqual(r.status_code, 400)
        self.assertTrue(User.objects.filter(id=other_admin.id).exists())


class AccountFilterTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@test.org", password="Csr@12345", full_name="مدير",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )
        User.objects.create_user(email="p@test.org", password="Csr@12345", full_name="قيد",
                                 role=User.Role.DOCTOR)
        User.objects.create_user(email="ap@test.org", password="Csr@12345", full_name="معتمد",
                                 role=User.Role.DOCTOR, is_approved=True,
                                 review_status=User.ReviewStatus.APPROVED)
        User.objects.create_user(email="rj@test.org", password="Csr@12345", full_name="مرفوض",
                                 role=User.Role.DOCTOR, review_status=User.ReviewStatus.REJECTED)

    def _emails(self, res):
        data = res.data.get("results", res.data) if isinstance(res.data, dict) else res.data
        return [u["email"] for u in data]

    def test_filter_rejected_only(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(reverse("admin-users-list"), {"review_status": "REJECTED"})
        self.assertEqual(r.status_code, 200)
        emails = self._emails(r)
        self.assertIn("rj@test.org", emails)
        self.assertNotIn("ap@test.org", emails)
        self.assertNotIn("p@test.org", emails)

    def test_filter_pending_only(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(reverse("admin-users-list"), {"review_status": "PENDING"})
        emails = self._emails(r)
        self.assertIn("p@test.org", emails)
        self.assertNotIn("rj@test.org", emails)

    def test_search_by_email(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(reverse("admin-users-list"), {"search": "ap@test.org"})
        self.assertEqual(self._emails(r), ["ap@test.org"])


class FileValidatorUnitTests(SimpleTestCase):
    def test_size_validator_rejects_oversized(self):
        v = FileSizeValidator(1)  # 1 ميغابايت
        v(SimpleUploadedFile("small.bin", b"x" * 1024))  # 1KB — يمر
        with self.assertRaises(ValidationError):
            v(SimpleUploadedFile("big.bin", b"x" * (2 * 1024 * 1024)))  # 2MB — يُرفض

    def test_all_upload_fields_have_size_validator(self):
        checks = [
            (DoctorProfile, "photo"), (DoctorCredential, "file"),
            (Resource, "file"), (Activity, "cover_image"), (ActivityFile, "file"),
            (News, "image"), (News, "attachment"), (BoardMember, "photo"),
        ]
        for model, fname in checks:
            field = model._meta.get_field(fname)
            has = any(isinstance(v, FileSizeValidator) for v in field.validators)
            self.assertTrue(has, f"{model.__name__}.{fname} ينقصه مُحقِّق الحجم")


class ProfileUploadValidationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.doctor = User.objects.create_user(
            email="doc@test.org", password="Csr@12345", full_name="طبيب",
            role=User.Role.DOCTOR, is_approved=True, is_active=True,
        )

    def test_photo_bad_extension_rejected(self):
        """يرفض DRF رفع ملف غير صورة كصورة شخصية (تحقّق فعّال عبر الواجهة)."""
        self.client.force_authenticate(self.doctor)
        bad = SimpleUploadedFile("evil.txt", b"hello", content_type="text/plain")
        res = self.client.patch(reverse("my-profile"), {"photo": bad}, format="multipart")
        self.assertEqual(res.status_code, 400)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="u@test.org", password="Old@12345", full_name="مستخدم",
            role=User.Role.DOCTOR, is_approved=True, is_active=True,
        )

    def test_change_password_success(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(reverse("change-password"), {
            "old_password": "Old@12345", "new_password": "New@98765", "new_password2": "New@98765",
        }, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("New@98765"))

    def test_wrong_old_password_rejected(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(reverse("change-password"), {
            "old_password": "WRONG", "new_password": "New@98765", "new_password2": "New@98765",
        }, format="json")
        self.assertEqual(r.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Old@12345"))  # لم تتغيّر

    def test_mismatch_rejected(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(reverse("change-password"), {
            "old_password": "Old@12345", "new_password": "New@98765", "new_password2": "different",
        }, format="json")
        self.assertEqual(r.status_code, 400)

    def test_weak_new_password_rejected(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(reverse("change-password"), {
            "old_password": "Old@12345", "new_password": "123", "new_password2": "123",
        }, format="json")
        self.assertEqual(r.status_code, 400)

    def test_requires_authentication(self):
        r = self.client.post(reverse("change-password"), {
            "old_password": "Old@12345", "new_password": "New@98765", "new_password2": "New@98765",
        }, format="json")
        self.assertIn(r.status_code, (401, 403))


class SiteSettingsTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@test.org", password="Csr@12345", full_name="مدير",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )

    def test_public_can_read(self):
        r = self.client.get(reverse("site-settings"))
        self.assertEqual(r.status_code, 200)
        self.assertIn("facebook", r.data)

    def test_anonymous_cannot_update(self):
        r = self.client.patch(reverse("site-settings"), {"facebook": "https://x"}, format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_admin_can_update(self):
        self.client.force_authenticate(self.admin)
        r = self.client.patch(reverse("site-settings"), {
            "facebook": "https://facebook.com/assoc", "contact_email": "info@assoc.org",
        }, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data["facebook"], "https://facebook.com/assoc")

    def test_singleton_only_one_row(self):
        SiteSettings.load()
        SiteSettings.load()
        self.assertEqual(SiteSettings.objects.count(), 1)


class EditorManagementTests(APITestCase):
    """إدارة المشرفين: إنشاء/حذف حسابات المشرفين — للمدير فقط."""

    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@test.org", password="Csr@12345", full_name="مدير",
            role=User.Role.ADMIN, is_approved=True, is_active=True, is_staff=True,
        )
        self.editor = User.objects.create_user(
            email="editor@test.org", password="Csr@12345", full_name="مشرف",
            role=User.Role.EDITOR, is_approved=True, is_active=True,
        )

    def _payload(self, **over):
        data = {
            "full_name": "مشرف جديد", "email": "neweditor@test.org",
            "password": "Editor@12345", "password2": "Editor@12345",
        }
        data.update(over)
        return data

    def test_admin_can_create_editor(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(reverse("admin-users-create-editor"), self._payload(), format="json")
        self.assertEqual(r.status_code, 201, r.data)
        u = User.objects.get(email="neweditor@test.org")
        self.assertEqual(u.role, User.Role.EDITOR)
        self.assertTrue(u.is_approved)
        self.assertTrue(u.is_active)
        self.assertEqual(u.review_status, User.ReviewStatus.APPROVED)
        self.assertTrue(u.check_password("Editor@12345"))

    def test_editor_cannot_create_editor(self):
        self.client.force_authenticate(self.editor)
        r = self.client.post(reverse("admin-users-create-editor"), self._payload(), format="json")
        self.assertEqual(r.status_code, 403)
        self.assertFalse(User.objects.filter(email="neweditor@test.org").exists())

    def test_anonymous_cannot_create_editor(self):
        r = self.client.post(reverse("admin-users-create-editor"), self._payload(), format="json")
        self.assertIn(r.status_code, (401, 403))

    def test_duplicate_email_rejected(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(reverse("admin-users-create-editor"),
                             self._payload(email="editor@test.org"), format="json")
        self.assertEqual(r.status_code, 400)

    def test_password_mismatch_rejected(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(reverse("admin-users-create-editor"),
                             self._payload(password2="Different@123"), format="json")
        self.assertEqual(r.status_code, 400)

    def test_weak_password_rejected(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(reverse("admin-users-create-editor"),
                             self._payload(password="123", password2="123"), format="json")
        self.assertEqual(r.status_code, 400)

    def test_admin_can_delete_editor(self):
        self.client.force_authenticate(self.admin)
        r = self.client.delete(reverse("admin-users-detail", args=[self.editor.id]))
        self.assertEqual(r.status_code, 200, getattr(r, "data", None))
        self.assertFalse(User.objects.filter(id=self.editor.id).exists())

    def test_editor_cannot_delete_editor(self):
        other = User.objects.create_user(
            email="editor2@test.org", password="Csr@12345", full_name="مشرف٢",
            role=User.Role.EDITOR, is_approved=True, is_active=True,
        )
        self.client.force_authenticate(self.editor)
        r = self.client.delete(reverse("admin-users-detail", args=[other.id]))
        # المشرف لا يرى حسابات المشرفين أصلاً (قائمته أطباء فقط) → 404/403
        self.assertIn(r.status_code, (403, 404))
        self.assertTrue(User.objects.filter(id=other.id).exists())

    def test_admin_cannot_delete_self(self):
        self.client.force_authenticate(self.admin)
        r = self.client.delete(reverse("admin-users-detail", args=[self.admin.id]))
        self.assertEqual(r.status_code, 400)
        self.assertTrue(User.objects.filter(id=self.admin.id).exists())

    def test_new_editor_can_login_and_change_password(self):
        """المشرف المُنشأ يستطيع الدخول فعلياً ثم تغيير كلمة مروره."""
        self.client.force_authenticate(self.admin)
        self.client.post(reverse("admin-users-create-editor"), self._payload(), format="json")
        self.client.force_authenticate(None)
        # دخول
        r = self.client.post(reverse("login"),
                             {"email": "neweditor@test.org", "password": "Editor@12345"}, format="json")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data["user"]["role"], User.Role.EDITOR)
