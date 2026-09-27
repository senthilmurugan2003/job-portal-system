import os
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config import Config


def _send_smtp_message(to_email, subject, body_text, body_html=None):
    """
    Synchronous internal SMTP sender.
    Connects to the configured SMTP server and sends email.
    """
    mail_server = Config.MAIL_SERVER
    mail_port = Config.MAIL_PORT
    mail_user = Config.MAIL_USERNAME
    mail_pass = Config.MAIL_PASSWORD
    mail_use_tls = Config.MAIL_USE_TLS
    sender = Config.MAIL_DEFAULT_SENDER or mail_user or "noreply@jobportal.com"

    if not mail_user or not mail_pass:
        print(f"[EmailService Notification] Email to {to_email} skipped - SMTP credentials not configured.")
        print(f"Subject: {subject}\nBody:\n{body_text}\n" + "-" * 50)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = sender
        msg["To"] = to_email
        msg["Subject"] = subject

        # Attach plain text
        part_text = MIMEText(body_text, "plain", "utf-8")
        msg.attach(part_text)

        # Attach HTML if provided
        if body_html:
            part_html = MIMEText(body_html, "html", "utf-8")
            msg.attach(part_html)

        if mail_port == 465:
            server = smtplib.SMTP_SSL(mail_server, mail_port, timeout=15)
        else:
            server = smtplib.SMTP(mail_server, mail_port, timeout=15)
            if mail_use_tls:
                server.starttls()

        server.login(mail_user, mail_pass)
        server.sendmail(sender, [to_email], msg.as_string())
        server.quit()
        print(f"[EmailService] Successfully sent '{subject}' to {to_email}")
        return True
    except Exception as e:
        print(f"[EmailService Error] Failed to send email to {to_email}: {e}")
        return False


def _async_send(to_email, subject, body_text, body_html=None):
    """Helper to dispatch email in background thread."""
    thread = threading.Thread(
        target=_send_smtp_message,
        args=(to_email, subject, body_text, body_html),
        daemon=True
    )
    thread.start()


# =========================================================
# 1. USER REGISTRATION EMAIL
# =========================================================

def send_registration_email(to_email, username):
    """
    Sends welcome email after user successfully registers.
    """
    subject = "Welcome to Job Portal System - Registration Successful"
    
    body_text = f"""Hello {username},

Welcome to Job Portal System!

Your account has been successfully created.

You can now:
- Complete your profile
- Search for jobs
- Apply for suitable opportunities

Thank you for joining us.

Regards,
Job Portal Team"""

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }}
            .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }}
            .header h2 {{ color: #2563eb; margin: 0; }}
            .content {{ line-height: 1.6; font-size: 15px; }}
            .list {{ background: #eff6ff; border-radius: 8px; padding: 15px 25px; margin: 20px 0; }}
            .footer {{ margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>JobPortal</h2>
            </div>
            <div class="content">
                <p>Hello <strong>{username}</strong>,</p>
                <p>Welcome to <strong>Job Portal System</strong>!</p>
                <p>Your account has been successfully created.</p>
                <div class="list">
                    <strong>You can now:</strong>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Search for jobs</li>
                        <li>Apply for suitable opportunities</li>
                    </ul>
                </div>
                <p>Thank you for joining us.</p>
            </div>
            <div class="footer">
                <p>Regards,<br><strong>Job Portal Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    _async_send(to_email, subject, body_text, body_html)


# =========================================================
# 2. FORGOT PASSWORD / PASSWORD RESET EMAIL
# =========================================================

def send_password_reset_email(to_email, username, reset_link):
    """
    Sends secure password reset link to user.
    """
    subject = "Reset Your Job Portal Password"

    body_text = f"""Hello {username},

We received a request to reset your password.

Click the link below to create a new password:

{reset_link}

This link will expire after 30 minutes.

If you did not request this change, please ignore this email.

Regards,
Job Portal Team"""

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }}
            .header {{ border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }}
            .header h2 {{ color: #2563eb; margin: 0; }}
            .content {{ line-height: 1.6; font-size: 15px; }}
            .btn {{ display: inline-block; background: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
            .link-text {{ word-break: break-all; color: #64748b; font-size: 13px; }}
            .footer {{ margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>JobPortal</h2>
            </div>
            <div class="content">
                <p>Hello <strong>{username}</strong>,</p>
                <p>We received a request to reset your password.</p>
                <p>Click the button below to create a new password:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="btn">Reset Password</a>
                </p>
                <p class="link-text">Or copy and paste this link in your browser:<br>{reset_link}</p>
                <p><strong>This link will expire after 30 minutes.</strong></p>
                <p>If you did not request this change, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>Regards,<br><strong>Job Portal Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    _async_send(to_email, subject, body_text, body_html)


# =========================================================
# 3. RECRUITER SHORTLIST CANDIDATE EMAIL
# =========================================================

def send_shortlist_email(to_email, candidate_name, job_title, company_name):
    """
    Sends shortlist congratulatory notification to candidate.
    """
    subject = f"Congratulations! You have been shortlisted for {job_title}"

    body_text = f"""Hello {candidate_name},

Congratulations!

You have been shortlisted for the position:

Job Role:
{job_title}

Company:
{company_name}

Our recruitment team will contact you regarding the next steps.

Thank you for applying.

Regards,
{company_name}"""

    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }}
            .header {{ border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }}
            .header h2 {{ color: #10b981; margin: 0; }}
            .badge {{ background: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-weight: bold; display: inline-block; }}
            .content {{ line-height: 1.6; font-size: 15px; }}
            .card {{ background: #f8fafc; border-left: 4px solid #10b981; border-radius: 6px; padding: 15px; margin: 20px 0; }}
            .footer {{ margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>JobPortal • Application Update</h2>
            </div>
            <div class="content">
                <p><span class="badge">Shortlisted</span></p>
                <p>Hello <strong>{candidate_name}</strong>,</p>
                <p>Congratulations! You have been shortlisted for the position:</p>
                <div class="card">
                    <p style="margin: 0 0 8px 0;"><strong>Job Role:</strong> {job_title}</p>
                    <p style="margin: 0;"><strong>Company:</strong> {company_name}</p>
                </div>
                <p>Our recruitment team will contact you regarding the next steps.</p>
                <p>Thank you for applying.</p>
            </div>
            <div class="footer">
                <p>Regards,<br><strong>{company_name}</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    _async_send(to_email, subject, body_text, body_html)
