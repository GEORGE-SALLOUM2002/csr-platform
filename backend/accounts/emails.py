"""
رسائل البريد الإلكتروني (ثنائية اللغة) لأحداث الحسابات.

- تُرسَل عند: استلام طلب الانتساب، اعتماد الحساب، رفض الحساب.
- كل دالة تُغلّف الإرسال بمعالجة أخطاء (لا تُفشِل طلب الـ API إذا تعذّر الإرسال)،
  وتُسجّل الخطأ في السجلّات.
- في التطوير تُطبع الرسائل في الطرفية (console backend)، وفي الإنتاج تُرسَل عبر SMTP.
"""
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger("csr")


def _login_url():
    base = (settings.SITE_URL or "").rstrip("/")
    return f"{base}/login" if base else ""


def _html_wrap(inner):
    """قالب HTML بسيط بهوية الموقع (تركوازي)، يدعم الاتجاهين."""
    return f"""\
<!doctype html>
<html>
  <body style="margin:0;background:#eef5f3;padding:24px;
               font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0c2b29;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;
                overflow:hidden;border:1px solid #d3e5e0;">
      <div style="background:#0e7c7b;padding:18px 24px;color:#ffffff;
                  font-size:18px;font-weight:700;">{settings.SITE_NAME}</div>
      <div style="padding:24px;line-height:1.8;font-size:15px;">{inner}</div>
      <div style="padding:14px 24px;background:#f2f8f6;color:#4e6c68;font-size:12px;
                  border-top:1px solid #e0eeea;">
        {settings.SITE_NAME} — رسالة آلية، الرجاء عدم الرد عليها /
        automated message, please do not reply.
      </div>
    </div>
  </body>
</html>"""


def _send(subject, to_email, text_body, html_inner):
    """إرسال رسالة (نص + HTML) مع معالجة الأخطاء — لا يرفع استثناءً أبداً."""
    if not to_email:
        return False
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        msg.attach_alternative(_html_wrap(html_inner), "text/html")
        msg.send(fail_silently=False)
        logger.info("تم إرسال بريد '%s' إلى %s", subject, to_email)
        return True
    except Exception:  # noqa: BLE001 — لا نريد إفشال طلب الـ API بسبب البريد
        logger.exception("تعذّر إرسال البريد إلى %s", to_email)
        return False


def send_registration_received(user):
    """تأكيد استلام طلب الانتساب (الحساب قيد المراجعة)."""
    name = user.full_name
    subject = f"{settings.SITE_NAME}: استلمنا طلب انتسابك / Application received"
    text_body = (
        f"مرحباً {name}،\n\n"
        f"استلمنا طلب انتسابك إلى {settings.SITE_NAME}. حسابك الآن قيد المراجعة من "
        f"قِبَل الإدارة، وسنُعلمك عبر البريد عند اعتماده.\n\n"
        f"— فريق {settings.SITE_NAME}\n\n"
        f"----------------------------------------\n\n"
        f"Hello {name},\n\n"
        f"We have received your membership application to {settings.SITE_NAME}. "
        f"Your account is now under review; we will email you once it is approved.\n\n"
        f"— The {settings.SITE_NAME} team"
    )
    html_inner = (
        f"<p>مرحباً <strong>{name}</strong>،</p>"
        f"<p>استلمنا طلب انتسابك إلى {settings.SITE_NAME}. حسابك الآن "
        f"<strong>قيد المراجعة</strong>، وسنُعلمك عبر البريد عند اعتماده.</p>"
        f"<hr style='border:none;border-top:1px solid #e0eeea;margin:18px 0'>"
        f"<p dir='ltr'>Hello <strong>{name}</strong>,</p>"
        f"<p dir='ltr'>We have received your membership application. Your account is "
        f"now <strong>under review</strong>; we will email you once it is approved.</p>"
    )
    return _send(subject, user.email, text_body, html_inner)


def send_account_approved(user):
    """إشعار اعتماد الحساب مع رابط الدخول."""
    name = user.full_name
    login = _login_url()
    subject = f"{settings.SITE_NAME}: تم اعتماد حسابك ✅ / Account approved"
    login_line_ar = f"\nيمكنك تسجيل الدخول من: {login}\n" if login else ""
    login_line_en = f"\nYou can sign in at: {login}\n" if login else ""
    text_body = (
        f"مرحباً {name}،\n\n"
        f"يسرّنا إعلامك بأنه تم اعتماد حسابك في {settings.SITE_NAME}. "
        f"أصبح بإمكانك الآن تسجيل الدخول ونشر المحتوى العلمي.{login_line_ar}\n"
        f"— فريق {settings.SITE_NAME}\n\n"
        f"----------------------------------------\n\n"
        f"Hello {name},\n\n"
        f"Your account at {settings.SITE_NAME} has been approved. "
        f"You can now sign in and publish scientific content.{login_line_en}\n"
        f"— The {settings.SITE_NAME} team"
    )
    btn = (
        f"<p style='margin:22px 0'><a href='{login}' "
        f"style='background:#0e7c7b;color:#fff;text-decoration:none;padding:11px 22px;"
        f"border-radius:8px;font-weight:700;display:inline-block'>تسجيل الدخول / Sign in</a></p>"
        if login else ""
    )
    html_inner = (
        f"<p>مرحباً <strong>{name}</strong>،</p>"
        f"<p>يسرّنا إعلامك بأنه <strong>تم اعتماد حسابك</strong> في {settings.SITE_NAME}. "
        f"أصبح بإمكانك تسجيل الدخول ونشر المحتوى العلمي.</p>"
        f"{btn}"
        f"<hr style='border:none;border-top:1px solid #e0eeea;margin:18px 0'>"
        f"<p dir='ltr'>Hello <strong>{name}</strong>,</p>"
        f"<p dir='ltr'>Your account has been <strong>approved</strong>. "
        f"You can now sign in and publish scientific content.</p>"
    )
    return _send(subject, user.email, text_body, html_inner)


def send_account_rejected(user, reason=""):
    """إشعار رفض/إلغاء اعتماد الحساب مع سبب اختياري."""
    name = user.full_name
    subject = f"{settings.SITE_NAME}: تحديث بخصوص طلب حسابك / Account update"
    reason_ar = f"\nالسبب: {reason}\n" if reason else ""
    reason_en = f"\nReason: {reason}\n" if reason else ""
    text_body = (
        f"مرحباً {name}،\n\n"
        f"نأسف لإعلامك بأنه لم يتم اعتماد طلب حسابك في {settings.SITE_NAME} في الوقت الحالي."
        f"{reason_ar}"
        f"يمكنك التواصل مع الإدارة لمزيد من التفاصيل أو إعادة التقديم.\n\n"
        f"— فريق {settings.SITE_NAME}\n\n"
        f"----------------------------------------\n\n"
        f"Hello {name},\n\n"
        f"We're sorry to inform you that your account application was not approved "
        f"at this time.{reason_en}"
        f"You may contact the administration for details or reapply.\n\n"
        f"— The {settings.SITE_NAME} team"
    )
    reason_block = (
        f"<p style='background:#f7e4e2;color:#8a2f28;padding:10px 14px;border-radius:8px'>"
        f"<strong>السبب / Reason:</strong> {reason}</p>" if reason else ""
    )
    html_inner = (
        f"<p>مرحباً <strong>{name}</strong>،</p>"
        f"<p>نأسف لإعلامك بأنه <strong>لم يتم اعتماد</strong> طلب حسابك في الوقت الحالي.</p>"
        f"{reason_block}"
        f"<p>يمكنك التواصل مع الإدارة لمزيد من التفاصيل أو إعادة التقديم.</p>"
        f"<hr style='border:none;border-top:1px solid #e0eeea;margin:18px 0'>"
        f"<p dir='ltr'>Hello <strong>{name}</strong>,</p>"
        f"<p dir='ltr'>We're sorry to inform you that your account application was "
        f"<strong>not approved</strong> at this time. You may contact the administration "
        f"for details or reapply.</p>"
    )
    return _send(subject, user.email, text_body, html_inner)


def send_password_reset(user, reset_url):
    """رسالة إعادة تعيين كلمة المرور مع رابط محدود الصلاحية."""
    name = user.full_name
    subject = f"{settings.SITE_NAME}: إعادة تعيين كلمة المرور / Password reset"
    text_body = (
        f"مرحباً {name}،\n\n"
        f"وصلنا طلب لإعادة تعيين كلمة مرور حسابك في {settings.SITE_NAME}. "
        f"لتعيين كلمة مرور جديدة افتح الرابط التالي:\n{reset_url}\n\n"
        f"إذا لم تطلب ذلك، تجاهل هذه الرسالة ولن يتغيّر شيء.\n"
        f"الرابط صالح لفترة محدودة.\n\n"
        f"— فريق {settings.SITE_NAME}\n\n"
        f"----------------------------------------\n\n"
        f"Hello {name},\n\n"
        f"We received a request to reset the password for your {settings.SITE_NAME} account. "
        f"To set a new password, open this link:\n{reset_url}\n\n"
        f"If you did not request this, ignore this message and nothing will change. "
        f"The link is valid for a limited time.\n\n"
        f"— The {settings.SITE_NAME} team"
    )
    btn = (
        f"<p style='margin:22px 0'><a href='{reset_url}' "
        f"style='background:#0e7c7b;color:#fff;text-decoration:none;padding:11px 22px;"
        f"border-radius:8px;font-weight:700;display:inline-block'>"
        f"إعادة تعيين كلمة المرور / Reset password</a></p>"
    )
    html_inner = (
        f"<p>مرحباً <strong>{name}</strong>،</p>"
        f"<p>وصلنا طلب لإعادة تعيين كلمة مرور حسابك في {settings.SITE_NAME}. "
        f"اضغط الزر أدناه لتعيين كلمة مرور جديدة:</p>"
        f"{btn}"
        f"<p style='color:#4e6c68;font-size:13px'>إذا لم تطلب ذلك فتجاهل هذه الرسالة — "
        f"لن يتغيّر شيء. الرابط صالح لفترة محدودة.</p>"
        f"<hr style='border:none;border-top:1px solid #e0eeea;margin:18px 0'>"
        f"<p dir='ltr'>Hello <strong>{name}</strong>,</p>"
        f"<p dir='ltr'>We received a request to reset your password. "
        f"Click the button above to set a new one.</p>"
        f"<p dir='ltr' style='color:#4e6c68;font-size:13px'>If you didn't request this, "
        f"ignore this message. The link is valid for a limited time.</p>"
    )
    return _send(subject, user.email, text_body, html_inner)
