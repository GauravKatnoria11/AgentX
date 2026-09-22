import logging
from datetime import date, datetime, timezone
from typing import Dict, Any, Optional
import resend
from app.config import settings
from app.supabase import MOCK_DATA

logger = logging.getLogger(__name__)


class EmailReminderService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY or "re_JgXyeiYh_AGbctPreY5vkLvoeCjAWTRbt"
        resend.api_key = self.api_key
        self.from_email = settings.RESEND_FROM_EMAIL or "onboarding@resend.dev"

    def build_appointment_reminder_html(self, appt_info: Dict[str, Any]) -> str:
        patient_name = appt_info.get("patient_name", "Valued Patient")
        doctor_name = appt_info.get("doctor_name", "Attending Specialist")
        doctor_spec = appt_info.get("doctor_specialization", "Specialist Consultation")
        hospital_name = appt_info.get("hospital_name", "Accredited Medical Center")
        hospital_addr = appt_info.get("hospital_address", "Hoshiarpur, Punjab")
        appt_date = appt_info.get("appointment_date", str(date.today()))
        appt_time = str(appt_info.get("appointment_time", "10:00"))[:5]
        queue_num = appt_info.get("queue_number", 1)
        reason = appt_info.get("reason", "Routine Consultation")

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .email-container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .email-header {{ background: linear-gradient(135deg, #1e40af, #2563eb); color: #ffffff; padding: 32px 24px; text-align: center; }}
            .brand {{ font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }}
            .tagline {{ font-size: 13px; opacity: 0.9; margin-top: 4px; }}
            .badge-alert {{ display: inline-block; background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 12px; margin-top: 14px; }}
            .email-body {{ padding: 28px 24px; }}
            .greeting {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
            .card-highlight {{ background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #cbd5e1; font-size: 14px; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .label {{ color: #64748b; font-weight: 500; }}
            .val {{ color: #0f172a; font-weight: 700; }}
            .queue-box {{ text-align: center; background: #dbeafe; color: #1e40af; padding: 12px; border-radius: 10px; font-size: 16px; font-weight: 800; margin: 16px 0; }}
            .instructions {{ background: #f1f5f9; padding: 16px; border-radius: 10px; margin: 20px 0; font-size: 13px; line-height: 1.6; color: #475569; }}
            .btn-cta {{ display: block; text-align: center; background: #2563eb; color: #ffffff !important; padding: 14px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 24px; }}
            .email-footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1 class="brand">🏥 HealthNexus Punjab</h1>
              <div class="tagline">Official Healthcare Dispatch & Hospital Consultation Network</div>
              <div class="badge-alert">🔔 SAME-DAY APPOINTMENT REMINDER</div>
            </div>
            
            <div class="email-body">
              <div class="greeting">Dear {patient_name},</div>
              <p style="font-size: 14px; line-height: 1.5; color: #334155; margin-top: 4px;">
                This is an automated reminder that your scheduled doctor consultation at <strong>{hospital_name}</strong> is scheduled for <strong>TODAY ({appt_date})</strong>.
              </p>
              
              <div class="card-highlight">
                <div class="detail-row">
                  <span class="label">Attending Doctor</span>
                  <span class="val">{doctor_name} ({doctor_spec})</span>
                </div>
                <div class="detail-row">
                  <span class="label">Hospital / Facility</span>
                  <span class="val">{hospital_name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date & Time</span>
                  <span class="val">📅 {appt_date} at ⏰ {appt_time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Clinical Reason</span>
                  <span class="val">{reason}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Location</span>
                  <span class="val">📍 {hospital_addr}</span>
                </div>
              </div>
              
              <div class="queue-box">
                Your Priority Token Position: #{queue_num}
              </div>

              <div class="instructions">
                <strong>📋 Patient Preparation Checklist:</strong>
                <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                  <li>Please arrive at the clinic reception 15 minutes before your time slot.</li>
                  <li>Carry your original government photo ID and previous diagnostic / lab reports.</li>
                  <li>In case of urgent rescheduling, notify the facility hospital desk promptly.</li>
                </ul>
              </div>

              <a href="http://127.0.0.1:5173" class="btn-cta">
                View Appointment & Live Hospital Route ↗
              </a>
            </div>

            <div class="email-footer">
              HealthNexus Health Informatics • Civil Lines & Model Town Medical District, Hoshiarpur, Punjab 146001<br/>
              Automated Resend Notification Gateway • Emergency Helpline: 108
            </div>
          </div>
        </body>
        </html>
        """

    def send_appointment_reminder(
        self,
        appointment: Dict[str, Any],
        override_recipient: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends an email reminder via Resend for a specific appointment.
        """
        resend.api_key = self.api_key

        doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appointment.get("doctor_id"))), None)
        hosp = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(appointment.get("hospital_id"))), None)
        patient_user = next((u for u in MOCK_DATA.get("profiles", []) if str(u["id"]) == str(appointment.get("patient_id"))), None)

        appt_info = {
            "patient_name": appointment.get("patient_name") or (patient_user.get("full_name") or patient_user.get("name") if patient_user else "Valued Patient"),
            "doctor_name": doc["name"] if doc else "Specialist Doctor",
            "doctor_specialization": doc.get("specialization", "General Medicine") if doc else "Consultant",
            "hospital_name": hosp["name"] if hosp else "Hospital",
            "hospital_address": hosp.get("address", "Hoshiarpur") if hosp else "Hoshiarpur",
            "appointment_date": str(appointment.get("appointment_date")),
            "appointment_time": str(appointment.get("appointment_time", "10:00")),
            "queue_number": appointment.get("queue_number", 1),
            "reason": appointment.get("reason", "Scheduled Medical Consultation")
        }

        # Determine recipient email
        to_email = override_recipient or appointment.get("patient_email")
        if not to_email and patient_user:
            to_email = patient_user.get("email")
        if not to_email:
            to_email = "patient@healthnexus.internal"

        # If using Resend sandbox (onboarding@resend.dev), Resend only allows sending to the registered account email
        # or delivered. For testing, we deliver to to_email or fallback
        subject = f"🔔 Appointment Reminder: Consultation with {appt_info['doctor_name']} at {appt_info['hospital_name']}"
        html_content = self.build_appointment_reminder_html(appt_info)

        logger.info(f"Dispatching Resend appointment reminder email to {to_email}...")

        try:
            r = resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": subject,
                "html": html_content
            })
            email_id = r.get("id") if isinstance(r, dict) else getattr(r, "id", "sent_resend")
            logger.info(f"Resend email dispatched successfully! ID: {email_id}")
            return {
                "success": True,
                "provider": "resend",
                "email_id": email_id,
                "recipient": to_email,
                "subject": subject,
                "sent_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as exc:
            err_msg = str(exc)
            logger.warning(f"Resend API call notice: {err_msg}")
            # If in sandbox mode where recipient domain isn't verified or offline,
            # we gracefully capture the status and return structured diagnostic info
            return {
                "success": False,
                "provider": "resend",
                "error": err_msg,
                "simulated_delivery": True,
                "recipient": to_email,
                "subject": subject,
                "sent_at": datetime.now(timezone.utc).isoformat()
            }

    def trigger_auto_reminders_for_today(self) -> Dict[str, Any]:
        """
        Automatically scans all appointments and triggers reminders for appointments
        scheduled for today that haven't been reminded yet.
        """
        today_str = str(date.today())
        triggered = []

        for appt in MOCK_DATA["appointments"]:
            # Trigger if appointment is scheduled for today or upcoming active
            is_today = str(appt.get("appointment_date")) == today_str
            is_active = appt.get("status") in ["confirmed", "pending"]
            not_yet_reminded = not appt.get("reminder_sent", False)

            if is_today and is_active and not_yet_reminded:
                res = self.send_appointment_reminder(appt)
                appt["reminder_sent"] = True
                appt["reminder_sent_at"] = datetime.now(timezone.utc).isoformat()
                appt["reminder_delivery"] = res

                # Add in-app notification as well
                doc = next((d for d in MOCK_DATA["doctors"] if str(d["id"]) == str(appt.get("doctor_id"))), None)
                MOCK_DATA["notifications"].append({
                    "id": f"notif-remind-{appt['id']}",
                    "user_id": str(appt.get("patient_id")),
                    "title": "🔔 Today's Appointment Reminder",
                    "message": f"Your appointment with {doc['name'] if doc else 'your doctor'} is scheduled for today at {str(appt.get('appointment_time'))[:5]}. Reminder email sent via Resend.",
                    "type": "reminder",
                    "is_read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                })

                triggered.append({
                    "appointment_id": appt["id"],
                    "patient_name": appt.get("patient_name", "Patient"),
                    "appointment_time": appt.get("appointment_time"),
                    "resend_result": res
                })

        return {
            "today": today_str,
            "total_reminders_triggered": len(triggered),
            "triggered_appointments": triggered
        }


email_reminder_service = EmailReminderService()
