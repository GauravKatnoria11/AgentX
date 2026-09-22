import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# In-memory data store for development/testing when live Supabase is not connected
MOCK_DATA = {
    "profiles": [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "role": "patient",
            "full_name": "John Doe",
            "email": "patient@example.com",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
            "gender": "Male",
            "blood_group": "O+",
            "address": "123 Main St, Springfield",
            "emergency_contact": "+1987654321",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "role": "doctor",
            "full_name": "Dr. Sarah Adams",
            "email": "doctor@example.com",
            "phone": "+1234567891",
            "date_of_birth": "1980-05-12",
            "gender": "Female",
            "blood_group": "A+",
            "address": "456 Oak St, Springfield",
            "emergency_contact": "+1987654322",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "role": "staff",
            "full_name": "Hospital Staff Mark",
            "email": "staff@example.com",
            "phone": "+1234567892",
            "metadata": {"hospital_id": "hosp-1"},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "44444444-4444-4444-4444-444444444444",
            "role": "admin",
            "full_name": "System Administrator",
            "email": "admin@example.com",
            "phone": "+1234567899",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
    ],
    "hospitals": [
        {
            "id": "hosp-1",
            "name": "City General Hospital",
            "type": "Super-Specialty",
            "address": "100 Medical Center Dr",
            "city": "Springfield",
            "state": "IL",
            "postal_code": "62701",
            "latitude": 39.7817,
            "longitude": -89.6501,
            "phone": "+1-217-555-0100",
            "email": "contact@citygeneral.org",
            "website": "https://citygeneral.org",
            "rating": 4.8,
            "services": ["Emergency", "Cardiology", "Neurology", "ICU", "Diagnostics", "Pediatrics"],
            "emergency_available": True,
            "operational_hours": "24/7",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-2",
            "name": "St. Jude Community Clinic",
            "type": "Clinic",
            "address": "250 Wellness Way",
            "city": "Springfield",
            "state": "IL",
            "postal_code": "62702",
            "latitude": 39.7900,
            "longitude": -89.6400,
            "phone": "+1-217-555-0200",
            "email": "care@stjudeclinic.org",
            "website": "https://stjudeclinic.org",
            "rating": 4.6,
            "services": ["General Medicine", "Pediatrics", "Vaccination", "Dental"],
            "emergency_available": False,
            "operational_hours": "8:00 AM - 8:00 PM",
            "created_at": "2026-01-01T00:00:00Z"
        }
    ],
    "departments": [
        {
            "id": "dept-1",
            "hospital_id": "hosp-1",
            "name": "Cardiology",
            "description": "Comprehensive cardiac diagnostics and interventional care.",
            "head_doctor_name": "Dr. Sarah Adams",
            "floor_location": "3rd Floor, Wing A",
            "contact_extension": "3100"
        },
        {
            "id": "dept-2",
            "hospital_id": "hosp-1",
            "name": "Neurology",
            "description": "Advanced neuro-medicine and surgical care.",
            "head_doctor_name": "Dr. Marcus Vance",
            "floor_location": "4th Floor, Wing B",
            "contact_extension": "4200"
        },
        {
            "id": "dept-3",
            "hospital_id": "hosp-2",
            "name": "Pediatrics",
            "description": "Child healthcare and pediatric wellness clinic.",
            "head_doctor_name": "Dr. Emily Taylor",
            "floor_location": "1st Floor",
            "contact_extension": "1100"
        }
    ],
    "doctors": [
        {
            "id": "doc-1",
            "user_id": "22222222-2222-2222-2222-222222222222",
            "hospital_id": "hosp-1",
            "department_id": "dept-1",
            "name": "Dr. Sarah Adams",
            "specialization": "Cardiology",
            "qualification": "MD, FACC - Cardiovascular Diseases",
            "experience_years": 14,
            "consultation_fee": 120.00,
            "bio": "Specialist in preventative cardiology, coronary interventions, and echocardiography.",
            "rating": 4.9,
            "is_available": True
        },
        {
            "id": "doc-2",
            "user_id": None,
            "hospital_id": "hosp-1",
            "department_id": "dept-2",
            "name": "Dr. Marcus Vance",
            "specialization": "Neurology",
            "qualification": "MD, PhD - Clinical Neurology",
            "experience_years": 11,
            "consultation_fee": 150.00,
            "bio": "Expert in headache disorders, neuro-rehab, and stroke management.",
            "rating": 4.8,
            "is_available": True
        },
        {
            "id": "doc-3",
            "user_id": None,
            "hospital_id": "hosp-2",
            "department_id": "dept-3",
            "name": "Dr. Emily Taylor",
            "specialization": "Pediatrics",
            "qualification": "MD - Pediatric Medicine",
            "experience_years": 8,
            "consultation_fee": 85.00,
            "bio": "Passionate pediatrician dedicated to compassionate infant and adolescent wellness.",
            "rating": 4.9,
            "is_available": True
        }
    ],
    "doctor_schedules": [
        {
            "id": "sched-1",
            "doctor_id": "doc-1",
            "day_of_week": 1, # Monday
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "is_active": True
        },
        {
            "id": "sched-2",
            "doctor_id": "doc-1",
            "day_of_week": 3, # Wednesday
            "start_time": "09:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 30,
            "is_active": True
        },
        {
            "id": "sched-3",
            "doctor_id": "doc-2",
            "day_of_week": 2, # Tuesday
            "start_time": "10:00:00",
            "end_time": "16:00:00",
            "slot_duration_minutes": 30,
            "is_active": True
        }
    ],
    "appointments": [
        {
            "id": "app-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-1",
            "hospital_id": "hosp-1",
            "department_id": "dept-1",
            "appointment_date": "2026-09-25",
            "appointment_time": "10:00:00",
            "status": "confirmed",
            "reason": "Routine cardiac checkup and BP review",
            "queue_number": 3,
            "notes": "Patient requested morning slot.",
            "created_at": "2026-09-20T10:00:00Z"
        }
    ],
    "labs": [
        {
            "id": "lab-1",
            "hospital_id": "hosp-1",
            "name": "Central Diagnostic & Imaging Lab",
            "test_types": ["Complete Blood Count (CBC)", "Lipid Panel", "MRI", "CT Scan", "X-Ray", "ECG"],
            "address": "102 Medical Center Dr, Suite B",
            "city": "Springfield",
            "latitude": 39.7820,
            "longitude": -89.6510,
            "contact_phone": "+1-217-555-0140",
            "hours": "7:00 AM - 9:00 PM",
            "price_range": "$$",
            "is_available": True
        },
        {
            "id": "lab-2",
            "hospital_id": None,
            "name": "Apex Pathology Labs",
            "test_types": ["Blood Test", "Thyroid Profile", "Urine Analysis", "HbA1c"],
            "address": "88 Commerce Blvd",
            "city": "Springfield",
            "latitude": 39.7750,
            "longitude": -89.6350,
            "contact_phone": "+1-217-555-0890",
            "hours": "8:00 AM - 7:00 PM",
            "price_range": "$",
            "is_available": True
        }
    ],
    "pharmacies": [
        {
            "id": "pharm-1",
            "hospital_id": "hosp-1",
            "name": "City General In-House Pharmacy",
            "address": "100 Medical Center Dr, Ground Floor",
            "city": "Springfield",
            "latitude": 39.7817,
            "longitude": -89.6501,
            "phone": "+1-217-555-0111",
            "hours": "24/7",
            "is_open": True
        },
        {
            "id": "pharm-2",
            "hospital_id": None,
            "name": "CarePoint Pharmacy",
            "address": "310 North Grand Ave",
            "city": "Springfield",
            "latitude": 39.7950,
            "longitude": -89.6450,
            "phone": "+1-217-555-0322",
            "hours": "8:00 AM - 10:00 PM",
            "is_open": True
        }
    ],
    "medicines": [
        {
            "id": "med-1",
            "pharmacy_id": "pharm-1",
            "name": "Atorvastatin 20mg",
            "generic_name": "Atorvastatin Calcium",
            "dosage_form": "Tablet",
            "strength": "20mg",
            "manufacturer": "Pfizer / Generic",
            "price": 14.50,
            "prescription_required": True,
            "in_stock": True
        },
        {
            "id": "med-2",
            "pharmacy_id": "pharm-1",
            "name": "Amoxicillin 500mg",
            "generic_name": "Amoxicillin",
            "dosage_form": "Capsule",
            "strength": "500mg",
            "manufacturer": "Teva",
            "price": 11.20,
            "prescription_required": True,
            "in_stock": True
        },
        {
            "id": "med-3",
            "pharmacy_id": "pharm-2",
            "name": "Paracetamol 500mg",
            "generic_name": "Acetaminophen",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "GSK",
            "price": 5.00,
            "prescription_required": False,
            "in_stock": True
        }
    ],
    "prescriptions": [
        {
            "id": "presc-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-1",
            "appointment_id": "app-1",
            "diagnosis": "Mild Hypertension & Hyperlipidemia",
            "medications": [
                {
                    "medicine_name": "Atorvastatin 20mg",
                    "dosage": "1 tablet",
                    "frequency": "Once daily at bedtime",
                    "duration": "30 days",
                    "instructions": "Take with water after dinner."
                }
            ],
            "instructions": "Reduce dietary sodium intake and log blood pressure daily.",
            "file_url": "https://storage.example.com/prescriptions/presc-1.pdf",
            "created_at": "2026-09-20T11:00:00Z"
        }
    ],
    "medical_records": [
        {
            "id": "rec-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-1",
            "hospital_id": "hosp-1",
            "title": "Lipid Profile & ECG Report",
            "record_type": "Lab Report",
            "file_url": "https://storage.example.com/records/rec-1.pdf",
            "file_name": "lipid_ecg_report.pdf",
            "file_size_bytes": 452000,
            "notes": "Cholesterol slightly elevated. ECG shows normal sinus rhythm.",
            "metadata": {"cholesterol": "215 mg/dL", "triglycerides": "160 mg/dL"},
            "created_at": "2026-09-18T14:30:00Z"
        }
    ],
    "followups": [
        {
            "id": "fol-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-1",
            "appointment_id": "app-1",
            "interval_type": "3d",
            "scheduled_at": "2026-09-28T10:00:00Z",
            "questions": [
                {"id": 1, "text": "Are you experiencing any chest discomfort or shortness of breath?", "type": "yes_no"},
                {"id": 2, "text": "What was your latest systolic blood pressure reading?", "type": "number"}
            ],
            "status": "pending",
            "created_at": "2026-09-20T11:30:00Z"
        }
    ],
    "followup_responses": [],
    "notifications": [
        {
            "id": "notif-1",
            "user_id": "11111111-1111-1111-1111-111111111111",
            "title": "Appointment Confirmed",
            "message": "Your appointment with Dr. Sarah Adams is confirmed for Sept 25, 10:00 AM.",
            "type": "appointment",
            "is_read": False,
            "created_at": "2026-09-20T10:05:00Z"
        }
    ],
    "audit_logs": []
}


class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        self._init_client()

    def _init_client(self):
        url = settings.SUPABASE_URL
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        if url and key and "sample-project" not in url and "your-project" not in url:
            try:
                self.client = create_client(url, key)
                logger.info("Supabase client initialized successfully with live endpoint.")
            except Exception as e:
                logger.warning(f"Failed to connect to Supabase: {e}. Falling back to internal engine.")
                self.client = None
        else:
            logger.info("No valid live Supabase credentials detected; operating in local mode.")

    @property
    def is_live(self) -> bool:
        return self.client is not None

    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        return MOCK_DATA.get(table_name, [])


supabase_service = SupabaseService()
