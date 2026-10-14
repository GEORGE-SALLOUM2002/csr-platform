"""اختبارات المحتوى: موضع الإعلان الذكي (أعلى الصفحة فقط أم مع أحدث الإعلانات)."""
from django.urls import reverse
from rest_framework.test import APITestCase

from accounts.models import User
from .models import SmartAnnouncement


class SmartAnnouncementPlacementTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@test.org", password="pass12345", full_name="مدير", role=User.Role.ADMIN,
        )

    def test_default_placement_is_both(self):
        """الإعلان الجديد يظهر في الشريط العلوي وفي «أحدث الإعلانات» (السلوك السابق)."""
        a = SmartAnnouncement.objects.create(title_ar="إعلان")
        self.assertEqual(a.placement, SmartAnnouncement.Placement.BOTH)

    def test_placement_saved_and_returned(self):
        self.client.force_authenticate(self.admin)
        url = reverse("announcements-list")
        res = self.client.post(url, {"title_ar": "إعلان", "placement": "BAR"}, format="multipart")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["placement"], "BAR")
        self.assertEqual(SmartAnnouncement.objects.get(pk=res.data["id"]).placement, "BAR")

    def test_invalid_placement_rejected(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post(
            reverse("announcements-list"), {"title_ar": "إعلان", "placement": "TOP"}, format="multipart",
        )
        self.assertEqual(res.status_code, 400)
