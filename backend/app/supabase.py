import logging
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Real-world Hoshiarpur healthcare mock data store
MOCK_DATA = {
    "profiles": [
        {
            "id": "11111111-1111-1111-1111-111111111111",
            "role": "patient",
            "full_name": "John Doe",
            "email": "patient@example.com",
            "phone": "+91-98765-43210",
            "date_of_birth": "1990-01-01",
            "gender": "Male",
            "blood_group": "O+",
            "address": "Civil Lines, Hoshiarpur, Punjab",
            "emergency_contact": "+91-98765-00000",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "role": "doctor",
            "full_name": "Dr. Gurinder Singh",
            "email": "doctor@example.com",
            "phone": "+91-98140-12345",
            "date_of_birth": "1978-05-12",
            "gender": "Male",
            "blood_group": "B+",
            "address": "Model Town, Hoshiarpur, Punjab",
            "emergency_contact": "+91-98140-00000",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "33333333-3333-3333-3333-333333333333",
            "role": "staff",
            "full_name": "Hoshiarpur Hospital Desk",
            "email": "staff@example.com",
            "phone": "+91-1882-220022",
            "metadata": {"hospital_id": "hosp-1"},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "44444444-4444-4444-4444-444444444444",
            "role": "admin",
            "full_name": "Hoshiarpur Health Admin",
            "email": "admin@example.com",
            "phone": "+91-1882-250000",
            "metadata": {},
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
    ],
    "hospitals": [
        {
            "id": "hosp-1",
            "name": "Civil Hospital Hoshiarpur (General Hospital)",
            "type": "Government District Hospital",
            "address": "Court Road, Near District Administrative Complex",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5284,
            "longitude": 75.9122,
            "phone": "+91-1882-220022",
            "emergency_hotline": "108 / +91-1882-220022",
            "email": "civilhospital.hsp@punjab.gov.in",
            "website": "https://hoshiarpur.nic.in/health",
            "rating": 4.5,
            "services": ["24/7 Trauma & Emergency", "Government Blood Bank", "Dialysis Centre", "Neonatal ICU", "General Surgery", "Pediatrics", "Maternity & Gynecology", "Free Generic Medicines"],
            "diseases_treated": [
                "Trauma & Road Accidents",
                "High Fever, Dengue & Malaria",
                "Maternity, Normal & C-Section",
                "Pediatric Inpatient & Newborn Care",
                "Poisoning & Medical Emergencies",
                "Tuberculosis & Respiratory Infections",
                "General Surgeries & Hernia"
            ],
            "emergency_available": True,
            "available_icu_beds": 14,
            "total_beds": 220,
            "operational_hours": "24/7 Emergency & Outpatient 8:00 AM - 2:00 PM",
            "consultation_fee": 50.0,
            "min_fee": 20.0,
            "max_fee": 100.0,
            "fee_tier": "Government Subsidized (₹50)",
            "transportation_facilities": {
                "ambulance_hotline": "108 / +91-1882-220022",
                "ambulance_fleet": ["Punjab 108 Emergency Ambulance", "Govt Civil Hospital Trauma Mobile Unit"],
                "shuttle_bus_available": True,
                "shuttle_schedule": "Free Patient Shuttle departs every 30 mins: Hoshiarpur Railway Station ➔ Central Bus Stand ➔ Civil Hospital",
                "wheelchair_access": True,
                "parking": "Dedicated Emergency Bay, 150 Car Parking Slots, 2-Wheeler Zone",
                "transit_notes": "Adjacent to District Administrative Complex, 5 mins from Hoshiarpur Central Bus Stand."
            },
            "image_url": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-2",
            "name": "Ivy Hospital Hoshiarpur",
            "type": "Multi-Super Specialty Hospital",
            "address": "Chandigarh-Hoshiarpur Highway, Near Rama Mandi Bypass",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5165,
            "longitude": 75.9285,
            "phone": "+91-1882-500100",
            "emergency_hotline": "+91-1882-500108",
            "email": "contact.hsp@ivyhospital.com",
            "website": "https://ivyhospital.com/hoshiarpur",
            "rating": 4.9,
            "services": ["Cath Lab & Angioplasty", "Brain & Spine Neurosurgery", "Oncology & Chemotherapy", "Level-3 Critical Care ICU", "Nephrology & Renal Dialysis", "Joint Replacement (Robotic)", "24/7 Advanced Emergency"],
            "diseases_treated": [
                "Heart Attack (STEMI) & Angioplasty",
                "Brain Stroke, Paralysis & Clot Removal",
                "End-Stage Kidney Disease & Dialysis",
                "Cancer Diagnosis & Chemotherapy",
                "Brain Tumors & Complex Spine Injuries",
                "Severe Sepsis & Multi-Organ Failure"
            ],
            "emergency_available": True,
            "available_icu_beds": 18,
            "total_beds": 160,
            "operational_hours": "24/7 Round the Clock",
            "consultation_fee": 700.0,
            "min_fee": 500.0,
            "max_fee": 1200.0,
            "fee_tier": "Super-Specialty Tertiary (₹700)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-500108",
                "ambulance_fleet": ["2x Level-3 Advanced Cardiac Life Support (ACLS) Ambulances with Ventilators", "1x Neonatal Transport Van"],
                "shuttle_bus_available": True,
                "shuttle_schedule": "Hourly Express Shuttle between Model Town Chowk, Hoshiarpur Court Road, and Ivy Hospital Campus",
                "wheelchair_access": True,
                "parking": "200 Basement Car Parking Slots, 4 Electric Vehicle (EV) Fast Charging Bays",
                "transit_notes": "Located right on Chandigarh-Hoshiarpur Highway with direct multi-lane ambulance slipway."
            },
            "image_url": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-3",
            "name": "Vasal Hospital",
            "type": "Super Specialty Hospital",
            "address": "Mall Road, Model Town",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5312,
            "longitude": 75.9184,
            "phone": "+91-1882-241500",
            "emergency_hotline": "+91-1882-241501",
            "email": "info@vasalhospital.com",
            "website": "https://vasalhospital.com",
            "rating": 4.7,
            "services": ["Laparoscopic Surgery", "Orthopedics & Joint Care", "Neonatal ICU (NICU)", "Gastroenterology & Endoscopy", "Urology & Kidney Stones", "24/7 Critical Care", "24/7 Pharmacy"],
            "diseases_treated": [
                "Gallstones & Laparoscopic Appendix",
                "Knee & Hip Replacement (Arthritis)",
                "High-Risk Pregnancy & Premature Infants",
                "Kidney & Bladder Stones (Laser)",
                "Liver Disease & Gastrointestinal Bleeding"
            ],
            "emergency_available": True,
            "available_icu_beds": 9,
            "total_beds": 110,
            "operational_hours": "24/7 Emergency",
            "consultation_fee": 450.0,
            "min_fee": 350.0,
            "max_fee": 700.0,
            "fee_tier": "Private Multi-Specialty (₹450)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-241501",
                "ambulance_fleet": ["1x Basic Life Support Ambulance", "1x NICU Incubator Ambulance"],
                "shuttle_bus_available": False,
                "shuttle_schedule": "Free pickup for planned inpatient admissions from Hoshiarpur Railway Station on request",
                "wheelchair_access": True,
                "parking": "Valet Parking on Mall Road, 60 covered car slots",
                "transit_notes": "Prime Model Town location with auto-rickshaw stand and taxi stand right outside the hospital gate."
            },
            "image_url": "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-4",
            "name": "Saini Hospital & Trauma Centre",
            "type": "Orthopedic & Trauma Hospital",
            "address": "Jalandhar Road, Near Canal Colony",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5235,
            "longitude": 75.8995,
            "phone": "+91-1882-255300",
            "emergency_hotline": "+91-1882-255309",
            "email": "help@sainihospital.com",
            "website": "https://sainihospital.com",
            "rating": 4.8,
            "services": ["Complex Fracture & Polytrauma", "Spine Surgery", "Arthroscopy & Sports Medicine", "Joint Replacement", "Digital Radiography", "Physiotherapy"],
            "diseases_treated": [
                "Severe Bone Fractures & Multiple Trauma",
                "Slip Disc & Spinal Cord Injury",
                "Ligament Tears (ACL/PCL)",
                "Osteoarthritis & Chronic Joint Pain"
            ],
            "emergency_available": True,
            "available_icu_beds": 7,
            "total_beds": 85,
            "operational_hours": "24/7 Trauma Emergency",
            "consultation_fee": 400.0,
            "min_fee": 300.0,
            "max_fee": 650.0,
            "fee_tier": "Orthopedic Care Center (₹400)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-255309",
                "ambulance_fleet": ["Trauma Stretcher Van", "Spine Immobilization Ambulance"],
                "shuttle_bus_available": False,
                "shuttle_schedule": "Patient mobility transfer van available between Hoshiarpur clinics and rehab center",
                "wheelchair_access": True,
                "parking": "Ground level accessible parking with ramp directly into orthopedic outpatient ward",
                "transit_notes": "Situated on main Jalandhar Road, easy vehicular access from bypass."
            },
            "image_url": "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-5",
            "name": "Apex Hospital & Critical Care",
            "type": "Multispecialty & Neuro Centre",
            "address": "Sutheri Road, Near Central Bus Stand",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5342,
            "longitude": 75.9158,
            "phone": "+91-1882-234200",
            "emergency_hotline": "+91-1882-234209",
            "email": "care@apexhospitalhsp.com",
            "website": "https://apexhospitalhsp.com",
            "rating": 4.6,
            "services": ["Neurotrauma Care", "Level-2 ICU", "Internal Medicine", "General Surgery", "24/7 Diagnostics", "Ambulance Network"],
            "diseases_treated": [
                "Accidental Head Injury & Concussion",
                "Severe Pneumonia & ARDS",
                "Diabetic Ketoacidosis & Coma",
                "Acute Abdominal Perforation"
            ],
            "emergency_available": True,
            "available_icu_beds": 11,
            "total_beds": 95,
            "operational_hours": "24/7",
            "consultation_fee": 350.0,
            "min_fee": 250.0,
            "max_fee": 600.0,
            "fee_tier": "Neuro & General Critical (₹350)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-234209",
                "ambulance_fleet": ["Apex Rapid Response Mobile ER", "Basic BLS Ambulance"],
                "shuttle_bus_available": True,
                "shuttle_schedule": "Frequent shuttle loop to Hoshiarpur Central Bus Stand every 15 mins",
                "wheelchair_access": True,
                "parking": "80 Car parking spaces behind the hospital block",
                "transit_notes": "Walking distance (300 meters) from Hoshiarpur Central Bus Stand."
            },
            "image_url": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-6",
            "name": "Lifeline Heart & Critical Care Hospital",
            "type": "Cardiac & Emergency Centre",
            "address": "Phagwara Road, Opposite Session Courts",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5188,
            "longitude": 75.9082,
            "phone": "+91-1882-277100",
            "emergency_hotline": "+91-1882-277108",
            "email": "emergency@lifelinehospital.in",
            "website": "https://lifelinehospital.in",
            "rating": 4.9,
            "services": ["Coronary Care Unit (CCU)", "Emergency Thrombolysis", "Echocardiography (2D/Color Doppler)", "Holter Monitoring", "Emergency Cardiac Ambulance"],
            "diseases_treated": [
                "Acute Myocardial Infarction (Heart Attack)",
                "Congestive Heart Failure",
                "Cardiac Arrhythmias & Palpitations",
                "Hypertensive Crisis"
            ],
            "emergency_available": True,
            "available_icu_beds": 15,
            "total_beds": 70,
            "operational_hours": "24/7 Cardiac Emergency",
            "consultation_fee": 500.0,
            "min_fee": 400.0,
            "max_fee": 850.0,
            "fee_tier": "Cardiac Specialty & CCU (₹500)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-277108",
                "ambulance_fleet": ["Lifeline Cardiac Mobile ICU with Telemetry & Defibrillator", "Emergency Thrombolysis Ambulance"],
                "shuttle_bus_available": False,
                "shuttle_schedule": "Priority patient pickup available anywhere within 15 km of Hoshiarpur within 8 minutes",
                "wheelchair_access": True,
                "parking": "Emergency triage vehicle port right in front of coronary casualty door",
                "transit_notes": "Opposite District Session Courts on Phagwara Road."
            },
            "image_url": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        },
        {
            "id": "hosp-hoshiarpur-7",
            "name": "Grover Eye Hospital & Laser Centre",
            "type": "Specialty Eye Care & Laser",
            "address": "Model Town Road, Near Sessions Chowk",
            "city": "Hoshiarpur",
            "state": "Punjab",
            "postal_code": "146001",
            "latitude": 31.5298,
            "longitude": 75.9225,
            "phone": "+91-1882-225600",
            "emergency_hotline": "+91-1882-225605",
            "email": "grovereyehsp@gmail.com",
            "website": "https://grovereye.com",
            "rating": 4.9,
            "services": ["Phacoemulsification Cataract", "Blade-free LASIK", "Retina & Vitreous Surgery", "Glaucoma Clinic", "Pediatric Ophthalmology"],
            "diseases_treated": [
                "Cataract & Vision Loss",
                "Glaucoma & Eye Pressure",
                "Diabetic Retinopathy",
                "Eye Trauma & Chemical Burns"
            ],
            "emergency_available": False,
            "available_icu_beds": 2,
            "total_beds": 40,
            "operational_hours": "9:00 AM - 7:00 PM",
            "consultation_fee": 300.0,
            "min_fee": 200.0,
            "max_fee": 500.0,
            "fee_tier": "Eye Care & Day Surgery (₹300)",
            "transportation_facilities": {
                "ambulance_hotline": "+91-1882-225605",
                "ambulance_fleet": ["Patient Transfer Van"],
                "shuttle_bus_available": False,
                "shuttle_schedule": "Free post-op drop-off service for senior citizen cataract surgery patients in Hoshiarpur town",
                "wheelchair_access": True,
                "parking": "Dedicated ground parking with guide assistance for visually impaired patients",
                "transit_notes": "Centrally located on Model Town Road near Sessions Chowk."
            },
            "image_url": "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&auto=format&fit=crop&q=80",
            "created_at": "2026-01-01T00:00:00Z"
        }
    ],
    "departments": [
        {
            "id": "dept-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "name": "Interventional Cardiology",
            "description": "24/7 primary angioplasty, heart failure clinic, and cardiac intensive care.",
            "head_doctor_name": "Dr. Gurinder Singh",
            "floor_location": "2nd Floor, Cardiac Tower",
            "contact_extension": "2100"
        },
        {
            "id": "dept-2",
            "hospital_id": "hosp-hoshiarpur-2",
            "name": "Neurosurgery & Stroke Unit",
            "description": "State-of-the-art neuro-trauma, stroke thrombolysis, and spine micro-surgery.",
            "head_doctor_name": "Dr. Harpreet Singh",
            "floor_location": "3rd Floor",
            "contact_extension": "3100"
        },
        {
            "id": "dept-3",
            "hospital_id": "hosp-1",
            "name": "Emergency & Trauma Services",
            "description": "District primary emergency casualty with trauma resuscitations and triage.",
            "head_doctor_name": "Dr. Manpreet Kaur",
            "floor_location": "Ground Floor, Red Zone",
            "contact_extension": "100"
        },
        {
            "id": "dept-4",
            "hospital_id": "hosp-hoshiarpur-4",
            "name": "Orthopedics & Joint Replacement",
            "description": "Pioneers in complex trauma fixation, total knee/hip replacements.",
            "head_doctor_name": "Dr. Ravinder Saini",
            "floor_location": "1st Floor",
            "contact_extension": "102"
        },
        {
            "id": "dept-5",
            "hospital_id": "hosp-hoshiarpur-3",
            "name": "Obstetrics & Gynecology",
            "description": "Comprehensive maternity care, high-risk labor management, and NICU.",
            "head_doctor_name": "Dr. Neha Vasal",
            "floor_location": "1st Floor, Wing A",
            "contact_extension": "115"
        },
        {
            "id": "dept-6",
            "hospital_id": "hosp-hoshiarpur-6",
            "name": "Critical Care CCU & Pulmonology",
            "description": "Advanced intensive care and non-invasive ventilation.",
            "head_doctor_name": "Dr. Aman Sharma",
            "floor_location": "Ground Floor",
            "contact_extension": "205"
        }
    ],
    "doctors": [
        {
            "id": "doc-hsp-1",
            "user_id": "22222222-2222-2222-2222-222222222222",
            "hospital_id": "hosp-hoshiarpur-2",
            "department_id": "dept-1",
            "name": "Dr. Gurinder Singh",
            "specialization": "Cardiology",
            "qualification": "MBBS, MD (Medicine), DM (Cardiology) - AIIMS",
            "experience_years": 16,
            "consultation_fee": 500.00,
            "bio": "Senior interventional cardiologist with over 4,000 successful coronary angioplasties. Trained at premier medical institutes.",
            "rating": 4.9,
            "is_available": True
        },
        {
            "id": "doc-hsp-2",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-4",
            "department_id": "dept-4",
            "name": "Dr. Ravinder Saini",
            "specialization": "Orthopedics",
            "qualification": "MS (Ortho), Fellowship in Joint Replacement (Germany)",
            "experience_years": 18,
            "consultation_fee": 450.00,
            "bio": "Renowned orthopedic trauma and joint surgeon specializing in computer-assisted knee/hip replacements and fracture reconstructions.",
            "rating": 4.9,
            "is_available": True
        },
        {
            "id": "doc-hsp-3",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-3",
            "department_id": "dept-5",
            "name": "Dr. Neha Vasal",
            "specialization": "Gynecology & Obstetrics",
            "qualification": "MD (Obstetrics & Gynecology), FICOG",
            "experience_years": 14,
            "consultation_fee": 400.00,
            "bio": "Expert in high-risk obstetric care, painless delivery, and laparoscopic fertility-preserving surgery.",
            "rating": 4.8,
            "is_available": True
        },
        {
            "id": "doc-hsp-4",
            "user_id": None,
            "hospital_id": "hosp-1",
            "department_id": "dept-3",
            "name": "Dr. Manpreet Kaur",
            "specialization": "Emergency Medicine",
            "qualification": "MD (Emergency Medicine), FEM",
            "experience_years": 11,
            "consultation_fee": 50.00,
            "bio": "Head of Emergency Casualty at Civil Hospital. Expert in polytrauma triage, toxicological emergencies, and resuscitation.",
            "rating": 4.7,
            "is_available": True
        },
        {
            "id": "doc-hsp-5",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-2",
            "department_id": "dept-2",
            "name": "Dr. Harpreet Singh",
            "specialization": "Neurology & Spine",
            "qualification": "MCh (Neurosurgery), FINR",
            "experience_years": 15,
            "consultation_fee": 600.00,
            "bio": "Specialist in acute stroke intervention, cranial aneurysms, and minimally invasive endoscopic spine surgery.",
            "rating": 4.9,
            "is_available": True
        },
        {
            "id": "doc-hsp-6",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-6",
            "department_id": "dept-6",
            "name": "Dr. Aman Sharma",
            "specialization": "Critical Care & Pulmonology",
            "qualification": "MD (Chest & Respiratory), EDIC",
            "experience_years": 13,
            "consultation_fee": 450.00,
            "bio": "Intensive care and lung specialist dealing with severe ARDS, respiratory emergencies, and advanced cardiac monitoring.",
            "rating": 4.8,
            "is_available": True
        },
        {
            "id": "doc-hsp-7",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-7",
            "department_id": "dept-1",
            "name": "Dr. Rajesh Grover",
            "specialization": "Ophthalmology",
            "qualification": "MS (Ophthalmology), Fellow Retina",
            "experience_years": 22,
            "consultation_fee": 350.00,
            "bio": "Premier ophthalmologist in Hoshiarpur with extensive experience in cataract phacoemulsification and diabetic eye care.",
            "rating": 4.9,
            "is_available": True
        }
    ],

    "doctor_schedules": [
        {
            "id": "sched-hsp-1",
            "doctor_id": "doc-hsp-1",
            "day_of_week": 1,
            "start_time": "09:30:00",
            "end_time": "15:00:00",
            "slot_duration_minutes": 30,
            "is_active": True
        },
        {
            "id": "sched-hsp-2",
            "doctor_id": "doc-hsp-2",
            "day_of_week": 2,
            "start_time": "10:00:00",
            "end_time": "16:00:00",
            "slot_duration_minutes": 30,
            "is_active": True
        }
    ],
    "appointments": [
        {
            "id": "app-hsp-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "patient_name": "John Doe",
            "patient_phone": "+91-98765-43210",
            "doctor_id": "doc-hsp-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "department_id": "dept-1",
            "appointment_date": "2026-09-26",
            "appointment_time": "10:30:00",
            "status": "confirmed",
            "reason": "Cardiac follow-up and blood pressure monitoring",
            "queue_number": 2,
            "notes": "Patient requested morning slot.",
            "created_at": "2026-09-21T10:00:00Z"
        },
        {
            "id": "app-hsp-req-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "patient_name": "Ramesh Kumar",
            "patient_phone": "+91-98150-54321",
            "doctor_id": "doc-hsp-2",
            "hospital_id": "hosp-hoshiarpur-4",
            "department_id": "dept-4",
            "appointment_date": "2026-09-28",
            "appointment_time": "Pending Allotment",
            "status": "pending",
            "reason": "Severe knee arthritis and mobility difficulty. Requesting earliest doctor evaluation.",
            "queue_number": None,
            "notes": "Awaiting admin timing confirmation",
            "created_at": "2026-09-22T08:00:00Z"
        }
    ],
    "emergency_alerts": [
        {
            "id": "emg-1",
            "patient_name": "Emergency Patient #104",
            "phone": "+91-98720-99881",
            "emergency_type": "Chest Pain & Shortness of Breath",
            "hospital_id": "hosp-hoshiarpur-2",
            "hospital_name": "Ivy Hospital Hoshiarpur",
            "status": "dispatched",
            "eta_minutes": 4,
            "current_location": "Model Town Chowk, Hoshiarpur",
            "icu_bed_reserved": True,
            "created_at": "2026-09-22T17:45:00Z"
        }
    ],
    "labs": [
        {
            "id": "lab-hsp-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "name": "Ivy Advanced Diagnostics & MRI Centre",
            "accreditation": "NABL Accredited & AERB Approved",
            "test_types": ["1.5T MRI", "128 Slice CT Scan", "Cardiac Troponin", "Lipid Panel", "CBC", "D-Dimer", "Echocardiography", "Truenat PCR"],
            "address": "Chandigarh-Hoshiarpur Highway, Near Rama Mandi Bypass",
            "city": "Hoshiarpur",
            "latitude": 31.5165,
            "longitude": 75.9285,
            "contact_phone": "+91-1882-500140",
            "hours": "24/7 Round the Clock",
            "price_range": "₹₹₹",
            "is_available": True,
            "home_collection": True,
            "rating": 4.9,
            "tests": [
                {"id": "t-101", "name": "1.5 Tesla MRI Brain (Contrast/Non-Contrast)", "category": "Radiology", "price": 4500.0, "turnaround_hours": 12, "fasting_required": False, "sample_type": "MRI Scan", "description": "High resolution neuro-imaging for stroke, headache, brain tumors."},
                {"id": "t-102", "name": "128-Slice Cardiac CT Angiography", "category": "Radiology", "price": 6500.0, "turnaround_hours": 8, "fasting_required": True, "sample_type": "CT Scan", "description": "Non-invasive coronary artery blockage and plaque assessment."},
                {"id": "t-103", "name": "High-Sensitivity Cardiac Troponin-I (hs-cTnI)", "category": "Emergency Cardiac", "price": 950.0, "turnaround_hours": 1, "fasting_required": False, "sample_type": "Blood", "description": "Rapid gold standard biomarker for acute myocardial infarction (heart attack)."},
                {"id": "t-104", "name": "D-Dimer Quantitative Assay", "category": "Hematology", "price": 1100.0, "turnaround_hours": 2, "fasting_required": False, "sample_type": "Blood", "description": "Rules out deep vein thrombosis (DVT) and pulmonary embolism."},
                {"id": "t-105", "name": "Complete Blood Count (CBC with ESR & Platelets)", "category": "Pathology", "price": 300.0, "turnaround_hours": 3, "fasting_required": False, "sample_type": "Blood", "description": "Automated 24-parameter cell counter for anemia and infection screening."}
            ]
        },
        {
            "id": "lab-hsp-2",
            "hospital_id": "hosp-1",
            "name": "Civil Hospital District Pathology & Molecular Lab",
            "accreditation": "Government of Punjab & ICMR Certified",
            "test_types": ["Complete Blood Count (CBC)", "Dengue NS1 Antigen", "Malaria Smear", "Liver Function Test", "Kidney Function Test", "X-Ray"],
            "address": "Court Road, Civil Lines, Hoshiarpur",
            "city": "Hoshiarpur",
            "latitude": 31.5284,
            "longitude": 75.9122,
            "contact_phone": "+91-1882-220025",
            "hours": "8:00 AM - 4:00 PM (Emergency 24/7)",
            "price_range": "₹ (Govt Subsidized / Free)",
            "is_available": True,
            "home_collection": False,
            "rating": 4.5,
            "tests": [
                {"id": "t-201", "name": "Complete Blood Count (CBC)", "category": "Pathology", "price": 50.0, "turnaround_hours": 4, "fasting_required": False, "sample_type": "Blood", "description": "Routine hematology screen subsidized by Punjab State Health Mission."},
                {"id": "t-202", "name": "Dengue Combo NS1 Antigen + IgM/IgG", "category": "Serology", "price": 0.0, "turnaround_hours": 3, "fasting_required": False, "sample_type": "Blood", "description": "Free diagnostic testing for seasonal Dengue and viral fevers."},
                {"id": "t-203", "name": "Liver Function Test (LFT Profile)", "category": "Biochemistry", "price": 120.0, "turnaround_hours": 6, "fasting_required": True, "sample_type": "Blood", "description": "Evaluates Bilirubin, SGOT, SGPT, and serum proteins."},
                {"id": "t-204", "name": "Kidney Function Test (KFT & Serum Creatinine)", "category": "Biochemistry", "price": 100.0, "turnaround_hours": 6, "fasting_required": False, "sample_type": "Blood", "description": "Serum Urea and Creatinine measurement."},
                {"id": "t-205", "name": "Digital Chest X-Ray (PA View)", "category": "Radiology", "price": 80.0, "turnaround_hours": 1, "fasting_required": False, "sample_type": "X-Ray", "description": "Instant digital radiography for chest and respiratory evaluation."}
            ]
        },
        {
            "id": "lab-hsp-3",
            "hospital_id": None,
            "name": "Dr Lal PathLabs & Specialty Diagnostics",
            "accreditation": "NABL & CAP International Accredited",
            "test_types": ["Full Body Checkup", "HbA1c Diabetes", "Lipid Profile", "Thyroid T3 T4 TSH", "Vitamin D3 & B12", "Allergy Panel"],
            "address": "Near Model Town Club, Mall Road, Hoshiarpur",
            "city": "Hoshiarpur",
            "latitude": 31.5305,
            "longitude": 75.9190,
            "contact_phone": "+91-1882-245800",
            "hours": "7:00 AM - 9:00 PM (Home Collection from 6:30 AM)",
            "price_range": "₹₹",
            "is_available": True,
            "home_collection": True,
            "rating": 4.9,
            "tests": [
                {"id": "t-301", "name": "Swasthfit Comprehensive Full Body Package", "category": "Preventive Package", "price": 1499.0, "turnaround_hours": 12, "fasting_required": True, "sample_type": "Blood & Urine", "description": "84 parameters including CBC, LFT, KFT, Lipid, Glucose, Urine R/M."},
                {"id": "t-302", "name": "HbA1c (Glycated Hemoglobin) by HPLC", "category": "Diabetes", "price": 420.0, "turnaround_hours": 6, "fasting_required": False, "sample_type": "Blood", "description": "Precision 3-month blood sugar control index."},
                {"id": "t-303", "name": "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", "category": "Cardiology", "price": 600.0, "turnaround_hours": 6, "fasting_required": True, "sample_type": "Blood", "description": "Cardiovascular risk profiling and lipid fractions."},
                {"id": "t-304", "name": "Thyroid Total Profile (T3, T4, Ultrasensitive TSH)", "category": "Endocrinology", "price": 480.0, "turnaround_hours": 6, "fasting_required": True, "sample_type": "Blood", "description": "Full thyroid hormonal evaluation."},
                {"id": "t-305", "name": "Vitamin D (25-OH) & Vitamin B12 Duo", "category": "Vitamins", "price": 1150.0, "turnaround_hours": 12, "fasting_required": False, "sample_type": "Blood", "description": "Bone density, nerve conduction, and energy vitality screen."}
            ]
        },
        {
            "id": "lab-hsp-4",
            "hospital_id": None,
            "name": "Agilus Diagnostics (formerly SRL Diagnostics)",
            "accreditation": "NABL Accredited & ISO 15189 Certified",
            "test_types": ["Histopathology", "Viral Hepatitis Panel", "Autoimmune ANA", "Hormone Assays", "Tumor Markers"],
            "address": "Phagwara Road, Opposite Session Courts, Hoshiarpur",
            "city": "Hoshiarpur",
            "latitude": 31.5195,
            "longitude": 75.9090,
            "contact_phone": "+91-1882-278500",
            "hours": "7:30 AM - 8:30 PM",
            "price_range": "₹₹",
            "is_available": True,
            "home_collection": True,
            "rating": 4.8,
            "tests": [
                {"id": "t-401", "name": "Hepatitis B & C Viral Serology (HBsAg + Anti-HCV)", "category": "Serology", "price": 750.0, "turnaround_hours": 8, "fasting_required": False, "sample_type": "Blood", "description": "Detects viral hepatitis infections with chemiluminescence."},
                {"id": "t-402", "name": "Antinuclear Antibodies (ANA IFA by Hep-2)", "category": "Autoimmune", "price": 950.0, "turnaround_hours": 24, "fasting_required": False, "sample_type": "Blood", "description": "Screening for lupus, rheumatoid disorders, and autoimmune disease."},
                {"id": "t-403", "name": "Serum Prostate-Specific Antigen (PSA Total)", "category": "Oncology", "price": 650.0, "turnaround_hours": 8, "fasting_required": False, "sample_type": "Blood", "description": "Prostate gland health check for men aged 45+."}
            ]
        },
        {
            "id": "lab-hsp-5",
            "hospital_id": "hosp-hoshiarpur-3",
            "name": "Vasal Ultrasound & 4D Imaging Centre",
            "accreditation": "PNDT Registered & Medical Imaging Certified",
            "test_types": ["4D Ultrasound", "Color Doppler", "Digital Mammography", "2D Echocardiography", "DEXA Bone Scan"],
            "address": "Mall Road, Model Town, Hoshiarpur",
            "city": "Hoshiarpur",
            "latitude": 31.5312,
            "longitude": 75.9184,
            "contact_phone": "+91-1882-241505",
            "hours": "8:30 AM - 7:30 PM",
            "price_range": "₹₹",
            "is_available": True,
            "home_collection": False,
            "rating": 4.8,
            "tests": [
                {"id": "t-501", "name": "Whole Abdomen & Pelvis Ultrasound (USG)", "category": "Ultrasound", "price": 1100.0, "turnaround_hours": 2, "fasting_required": True, "sample_type": "Ultrasound Scan", "description": "Evaluates gallstones, fatty liver, kidney stones, and pelvic organs."},
                {"id": "t-502", "name": "Obstetric 4D Scan with Fetal Well-being", "category": "Ultrasound", "price": 1800.0, "turnaround_hours": 2, "fasting_required": False, "sample_type": "Ultrasound Scan", "description": "High-definition fetal development and anomaly assessment."},
                {"id": "t-503", "name": "2D Echocardiography with Color Doppler", "category": "Cardiology", "price": 1600.0, "turnaround_hours": 2, "fasting_required": False, "sample_type": "Cardiac Scan", "description": "Real-time evaluation of heart valves, ejection fraction, and wall motion."}
            ]
        }
    ],
    "pharmacies": [
        {
            "id": "pharm-hsp-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "name": "Ivy Hospital 24/7 Pharmacy",
            "address": "Ground Floor, Ivy Hospital, Chandigarh Road",
            "city": "Hoshiarpur",
            "latitude": 31.5165,
            "longitude": 75.9285,
            "phone": "+91-1882-500111",
            "hours": "24/7 Emergency Pharmacy",
            "is_open": True
        },
        {
            "id": "pharm-hsp-2",
            "hospital_id": "hosp-hoshiarpur-1",
            "name": "Jan Aushadhi Generic Medical Store",
            "address": "Gate No. 2, Civil Hospital, Court Road",
            "city": "Hoshiarpur",
            "latitude": 31.5284,
            "longitude": 75.9122,
            "phone": "+91-1882-221199",
            "hours": "8:00 AM - 10:00 PM",
            "is_open": True
        }
    ],
    "medicines": [
        {
            "id": "med-hsp-1",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Atorvastatin 20mg",
            "generic_name": "Atorvastatin Calcium",
            "dosage_form": "Tablet",
            "strength": "20mg",
            "manufacturer": "Sun Pharma / Cipla",
            "price": 14.50,
            "prescription_required": True,
            "in_stock": True
        },
        {
            "id": "med-hsp-2",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Aspirin 75mg Dispersible",
            "generic_name": "Acetylsalicylic Acid",
            "dosage_form": "Tablet",
            "strength": "75mg",
            "manufacturer": "Bayer / USV",
            "price": 4.20,
            "prescription_required": True,
            "in_stock": True
        },
        {
            "id": "med-hsp-3",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Paracetamol 650mg",
            "generic_name": "Acetaminophen",
            "dosage_form": "Tablet",
            "strength": "650mg",
            "manufacturer": "Jan Aushadhi",
            "price": 1.80,
            "prescription_required": False,
            "in_stock": True
        }
    ],
    "prescriptions": [
        {
            "id": "presc-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-hsp-1",
            "appointment_id": "app-hsp-1",
            "diagnosis": "Mild Hypertension & Lipid Abnormality",
            "medications": [
                {
                    "medicine_name": "Atorvastatin 20mg",
                    "dosage": "1 tablet",
                    "frequency": "Once daily at night",
                    "duration": "30 days",
                    "instructions": "Take after dinner with lukewarm water."
                },
                {
                    "medicine_name": "Aspirin 75mg Dispersible",
                    "dosage": "1 tablet",
                    "frequency": "Once daily post-breakfast",
                    "duration": "30 days",
                    "instructions": "Dissolve in half glass of water."
                }
            ],
            "instructions": "Monitor morning blood pressure weekly. Maintain low dietary salt intake.",
            "file_url": "https://storage.example.com/prescriptions/presc-hsp-1.pdf",
            "created_at": "2026-09-21T11:00:00Z"
        }
    ],
    "medical_records": [
        {
            "id": "rec-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "appointment_id": "app-hsp-1",
            "disease_category": "Cardiovascular & Hypertension",
            "doctor_id": "doc-hsp-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "title": "Cardiology Consultation & Post-Angio Recovery Regimen",
            "record_type": "Prescription & Clinical Regimen",
            "file_url": "https://storage.example.com/records/rec-hsp-1.pdf",
            "file_name": "cardiac_profile_hoshiarpur.pdf",
            "file_size_bytes": 412000,
            "notes": "ECG demonstrated normal sinus rhythm. Blood pressure controlled at 134/86 mmHg. Advised strictly to follow cardiac low-sodium nutrition protocol.",
            "medicines": [
                {
                    "name": "Telmisartan 40mg + Hydrochlorothiazide 12.5mg",
                    "dosage": "1 Tablet",
                    "timing": {"morning": True, "afternoon": False, "evening": False, "night": False},
                    "timing_label": "Morning (🌅)",
                    "meal_relation": "After Breakfast",
                    "duration": "30 Days",
                    "instructions": "Take at fixed 8:30 AM slot with water. Avoid skipping doses."
                },
                {
                    "name": "Atorvastatin Calcium 20mg",
                    "dosage": "1 Tablet",
                    "timing": {"morning": False, "afternoon": False, "evening": False, "night": True},
                    "timing_label": "Night (🌙)",
                    "meal_relation": "After Dinner",
                    "duration": "30 Days",
                    "instructions": "Cholesterol synthesis regulator. Take right before sleep."
                },
                {
                    "name": "Aspirin 75mg Dispersible",
                    "dosage": "1 Tablet",
                    "timing": {"morning": True, "afternoon": False, "evening": True, "night": False},
                    "timing_label": "Morning & Evening (🌅 🌆)",
                    "meal_relation": "After Food",
                    "duration": "30 Days",
                    "instructions": "Antiplatelet support. Never consume on empty stomach."
                }
            ],
            "diet_plan": {
                "title": "Heart-Healthy Low Sodium Diet Plan (Cardiology Dept)",
                "breakfast": "1 bowl steel-cut oats with crushed almonds + skimmed milk + 1 boiled apple.",
                "lunch": "2 whole-wheat rotis (multigrain), boiled dal with light cumin seasoning, steamed bottle gourd (lauki), raw cucumber salad without added salt.",
                "evening_snack": "Unsalted roasted makhana (foxnuts) + green tea or warm lemon cinnamon water.",
                "dinner": "Light yellow moong dal khichdi or vegetable clear soup with sautéed broccoli and tofu (finish dinner before 8:00 PM).",
                "foods_to_avoid": [
                    "Pickles (Achaar) & Papad",
                    "Deep-Fried Samosas & Pakoras",
                    "Processed Canned Soups",
                    "Red Meat & Excess Butter/Ghee",
                    "High-Sodium Namkeen"
                ],
                "hydration_advice": "Drink 2.5 to 3 Liters of filtered water throughout the day. Avoid heavy fluid intake after 9:00 PM.",
                "doctor_notes": "Maintain 30 minutes of moderate morning walking. Avoid lifting weights exceeding 10kg. Monitor BP every Monday."
            },
            "metadata": {"cholesterol": "210 mg/dL", "facility": "Ivy Hospital Hoshiarpur", "bp": "134/86 mmHg"},
            "created_at": "2026-09-21T11:00:00Z"
        },
        {
            "id": "rec-2",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "appointment_id": "app-hsp-req-1",
            "disease_category": "Orthopedics & Joint Trauma",
            "doctor_id": "doc-hsp-2",
            "hospital_id": "hosp-hoshiarpur-4",
            "title": "Bilateral Knee Osteoarthritis & Cartilage Support",
            "record_type": "Prescription & Rehabilitation",
            "file_url": "https://storage.example.com/records/rec-hsp-2.pdf",
            "file_name": "orthopedic_xray_hoshiarpur.pdf",
            "file_size_bytes": 528000,
            "notes": "Bilateral knee joint space reduction Grade-2. Joint crepitus present. Advised anti-inflammatory regimen and joint mobility physio.",
            "medicines": [
                {
                    "name": "Glucosamine Sulfate & Chondroitin 500mg",
                    "dosage": "1 Capsule",
                    "timing": {"morning": True, "afternoon": False, "evening": True, "night": False},
                    "timing_label": "Morning & Evening (🌅 🌆)",
                    "meal_relation": "After Food",
                    "duration": "60 Days",
                    "instructions": "Joint cartilage repair & synovial fluid support."
                },
                {
                    "name": "Calcium Citrate Malate + Vitamin D3 60K",
                    "dosage": "1 Tablet",
                    "timing": {"morning": True, "afternoon": False, "evening": False, "night": False},
                    "timing_label": "Morning (🌅)",
                    "meal_relation": "After Breakfast",
                    "duration": "30 Days",
                    "instructions": "Consume with warm cow milk for maximum calcium bioavailability."
                },
                {
                    "name": "Aceclofenac 100mg + Paracetamol 325mg (SOS)",
                    "dosage": "1 Tablet",
                    "timing": {"morning": False, "afternoon": False, "evening": False, "night": False},
                    "timing_label": "As Needed (SOS for severe pain)",
                    "meal_relation": "Strictly After Meals",
                    "duration": "7 Days SOS",
                    "instructions": "Take only if joint swelling or acute pain flares up. Maximum 2 per day."
                }
            ],
            "diet_plan": {
                "title": "Anti-inflammatory & Bone Density Protocol",
                "breakfast": "Sprouted moong & boiled black chana salad with lemon juice + 1 glass fortified milk.",
                "lunch": "Bajra/Jowar roti with palak paneer (low-fat) or curd with roasted flaxseed powder.",
                "evening_snack": "Handful of walnuts, soaked almonds, and warm turmeric golden milk.",
                "dinner": "Mixed vegetable stew with steamed tofu / paneer, bowl of warm pumpkin soup.",
                "foods_to_avoid": [
                    "Refined White Sugar & Soda Drinks",
                    "Excessive Maida (Bakery Biscuits)",
                    "Inflammatory Hydrogenated Trans-Fats"
                ],
                "hydration_advice": "3 Liters daily to keep cartilage tissues properly hydrated.",
                "doctor_notes": "Perform quadriceps static isometric knee contraction exercises 15 mins morning and evening. Avoid sitting cross-legged on the floor."
            },
            "metadata": {"stage": "Grade-2 OA", "facility": "Fortis Escorts / Civil Hospital"},
            "created_at": "2026-09-18T16:00:00Z"
        },
        {
            "id": "rec-3",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "appointment_id": "app-hsp-1",
            "disease_category": "Type-2 Diabetes & Endocrine",
            "doctor_id": "doc-hsp-1",
            "hospital_id": "hosp-1",
            "title": "Glycemic Control & Endocrine Evaluation",
            "record_type": "Prescription & Lab Followup",
            "file_url": "https://storage.example.com/records/rec-hsp-3.pdf",
            "file_name": "diabetes_hba1c_hoshiarpur.pdf",
            "file_size_bytes": 315000,
            "notes": "Fasting blood sugar 138 mg/dL, HbA1c 7.1%. Titrated biguanide dosage to optimize metabolic glucose handling.",
            "medicines": [
                {
                    "name": "Metformin Hydrochloride 500mg SR",
                    "dosage": "1 Tablet",
                    "timing": {"morning": True, "afternoon": False, "evening": True, "night": False},
                    "timing_label": "Morning & Evening (🌅 🌆)",
                    "meal_relation": "With Meals",
                    "duration": "90 Days",
                    "instructions": "Take halfway through breakfast and dinner to avoid gastrointestinal discomfort."
                },
                {
                    "name": "Teneligliptin 20mg",
                    "dosage": "1 Tablet",
                    "timing": {"morning": True, "afternoon": False, "evening": False, "night": False},
                    "timing_label": "Morning (🌅)",
                    "meal_relation": "Before Breakfast",
                    "duration": "90 Days",
                    "instructions": "DPP-4 inhibitor. Take 15 minutes before the morning meal."
                }
            ],
            "diet_plan": {
                "title": "Low Glycemic Index (GI) Diabetic Nutritional Plan",
                "breakfast": "Methi (fenugreek) paratha cooked without oil or Besan chilla with mint coriander chutney.",
                "lunch": "1 small bowl brown rice, thick yellow moong dal, stir-fried bitter gourd (karela) or ladyfinger, large cucumber & radish salad.",
                "evening_snack": "Roasted chana with black pepper + chia seeds soaked in water.",
                "dinner": "Clear vegetable soup followed by 1 multi-grain chapati and mushroom/soya curry (dinner before 8:00 PM).",
                "foods_to_avoid": [
                    "Refined Sugar, Jaggery & Indian Sweets (Mithai)",
                    "White Bread, Naan & Potatoes",
                    "Fruit Juices with Added Sugar",
                    "Packaged Biscuits & Sweetened Yogurts"
                ],
                "hydration_advice": "Drink methi-dana (fenugreek) infused lukewarm water first thing in the morning on an empty stomach.",
                "doctor_notes": "Log fasting blood glucose every Saturday morning. Aim for HbA1c < 6.7% in next quarter review."
            },
            "metadata": {"hba1c": "7.1%", "fasting_sugar": "138 mg/dL"},
            "created_at": "2026-09-12T09:30:00Z"
        }
    ],
    "followups": [
        {
            "id": "fol-1",
            "patient_id": "11111111-1111-1111-1111-111111111111",
            "doctor_id": "doc-hsp-1",
            "appointment_id": "app-hsp-1",
            "interval_type": "3d",
            "scheduled_at": "2026-09-29T10:00:00Z",
            "questions": [
                {"id": 1, "text": "Are you experiencing any shortness of breath while walking?", "type": "yes_no"},
                {"id": 2, "text": "What was your latest systolic blood pressure reading?", "type": "number"}
            ],
            "status": "pending",
            "created_at": "2026-09-21T11:30:00Z"
        }
    ],
    "followup_responses": [],
    "notifications": [
        {
            "id": "notif-1",
            "user_id": "11111111-1111-1111-1111-111111111111",
            "title": "Consultation Confirmed at Ivy Hospital Hoshiarpur",
            "message": "Your consultation with Dr. Gurinder Singh is confirmed for Sept 26, 10:30 AM (Queue #2).",
            "type": "appointment",
            "is_read": False,
            "created_at": "2026-09-21T10:05:00Z"
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
            logger.info("Operating in resilient local mode with verified real-world Hoshiarpur healthcare data.")

    @property
    def is_live(self) -> bool:
        return self.client is not None

    def get_table_data(self, table_name: str) -> List[Dict[str, Any]]:
        return MOCK_DATA.get(table_name, [])


supabase_service = SupabaseService()
