"""اختبار سريع لنقاط النهاية والصلاحيات (يُشغّل داخل بيئة الاختبار فقط)."""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["ALLOWED_HOSTS"] = "testserver,localhost,127.0.0.1"
django.setup()

from rest_framework.test import APIClient

c = APIClient()
ok, fail = 0, 0

def check(label, cond):
    global ok, fail
    if cond:
        ok += 1; print(f"  ✓ {label}")
    else:
        fail += 1; print(f"  ✗ FAIL: {label}")

def login(email, pw="Csr@12345"):
    r = c.post("/api/auth/login/", {"email": email, "password": pw}, format="json")
    assert r.status_code == 200, (email, r.status_code, r.content[:200])
    return r.data["access"], r.data["user"]

print("== عام (زائر بدون تسجيل) ==")
c.credentials()
check("news list 200", c.get("/api/news/").status_code == 200)
check("doctors directory 200", c.get("/api/doctors/").status_code == 200)
check("board 200", c.get("/api/board/").status_code == 200)
check("patient-topics 200", c.get("/api/patient-topics/").status_code == 200)
check("announcements (live only) 200", c.get("/api/announcements/").status_code == 200)
r = c.get("/api/resources/")
approved_only = all(x["status"] == "APPROVED" for x in r.data["results"])
check("resources public = APPROVED only", r.status_code == 200 and approved_only)
check("contact create (anon) 201", c.post("/api/contact/", {"name": "x", "email": "a@a.com", "message": "hi"}, format="json").status_code == 201)
check("cannot create news as anon (401/403)", c.post("/api/news/", {"title_ar": "x"}, format="json").status_code in (401, 403))

print("== طبيب معتمد ==")
tok, user = login("nour@csr.org")
c.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
check("role DOCTOR", user["role"] == "DOCTOR")
check("me 200", c.get("/api/auth/me/").status_code == 200)
check("my profile 200", c.get("/api/auth/me/profile/").status_code == 200)
r = c.post("/api/resources/", {"title_ar": "بحث اختبار", "resource_type": "RESEARCH"}, format="json")
check("doctor upload -> 201 & PENDING", r.status_code == 201 and r.data["status"] == "PENDING")
check("doctor 'mine' includes own", c.get("/api/resources/mine/").status_code == 200)

print("== طبيب قيد المراجعة ==")
tok, _ = login("pending@csr.org")
c.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
r = c.post("/api/resources/", {"title_ar": "y", "resource_type": "ARTICLE"}, format="json")
check("unapproved doctor upload blocked (403)", r.status_code == 403)

print("== مشرف علمي ==")
tok, user = login("editor@csr.org")
c.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
check("role EDITOR", user["role"] == "EDITOR")
r = c.get("/api/resources/pending/")
items = r.data["results"] if isinstance(r.data, dict) and "results" in r.data else r.data
check("editor sees pending queue", r.status_code == 200 and len(items) >= 1)
pending_id = items[0]["id"]
r2 = c.post(f"/api/resources/{pending_id}/review/", {"action": "approve"}, format="json")
check("editor approve -> APPROVED", r2.status_code == 200 and r2.data["resource"]["status"] == "APPROVED")
check("editor can create news", c.post("/api/news/", {"title_ar": "خبر من المشرف"}, format="json").status_code == 201)
check("editor CANNOT manage board (403)", c.post("/api/board/", {"name_ar": "x", "role_ar": "y"}, format="json").status_code == 403)

print("== مدير النظام ==")
tok, user = login("admin@csr.org")
c.credentials(HTTP_AUTHORIZATION=f"Bearer {tok}")
check("role ADMIN", user["role"] == "ADMIN")
r = c.get("/api/admin/users/?is_approved=false")
check("admin lists users", r.status_code == 200)
# اعتماد الطبيب المعلّق
pend = c.get("/api/admin/users/?search=pending@csr.org").data["results"][0]
r2 = c.post(f"/api/admin/users/{pend['id']}/approve/", {}, format="json")
check("admin approve doctor", r2.status_code == 200 and r2.data["user"]["is_approved"] is True)
check("admin can manage board", c.post("/api/board/", {"name_ar": "عضو جديد", "role_ar": "عضو"}, format="json").status_code == 201)
check("doctor (nour) cannot list admin users (403)",
      (lambda t: (c.credentials(HTTP_AUTHORIZATION=f"Bearer {t}"), c.get('/api/admin/users/').status_code)[1])(login('nour@csr.org')[0]) == 403)

print(f"\n==== النتيجة: {ok} ناجح، {fail} فاشل ====")
raise SystemExit(1 if fail else 0)
