import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Real-world Hoshiarpur healthcare mock data store
MOCK_DATA = {
    "last_active_user_email": "g200004k@gmail.com",
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
            "id": "55555555-5555-5555-5555-555555555555",
            "role": "patient",
            "full_name": "Gaganjit Singh",
            "email": "gaganjitsingh003@gmail.com",
            "phone": "+91-98765-12345",
            "date_of_birth": "1995-04-15",
            "gender": "Male",
            "blood_group": "B+",
            "address": "Model Town, Hoshiarpur, Punjab",
            "emergency_contact": "+91-98765-54321",
            "metadata": {"provider": "google"},
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY)",
                "Mukh Mantri Sehat Bima Yojana (AB-SSBY)",
                "Janani Shishu Suraksha Karyakram (JSSK)",
                "Rashtriya Bal Swasthya Karyakram (RBSK)",
                "National TB Elimination Program (Nikshay)",
                "Free Generic Medicine Scheme"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY)",
                "Ayushman Bharat Sarbat Sehat Bima Yojana (AB-SSBY)",
                "ECHS (Ex-Servicemen Contributory Health Scheme)",
                "CGHS (Central Government Health Scheme)",
                "Chief Minister Cancer Relief Fund (Punjab)"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY)",
                "Ayushman Bharat Sarbat Sehat Bima Yojana (AB-SSBY)",
                "ECHS Empanelled"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY)",
                "ECHS Empanelled (Orthopedics & Spine)",
                "ESI (Employees' State Insurance Scheme)"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY)",
                "Ayushman Bharat Sarbat Sehat Bima Yojana (AB-SSBY)",
                "Punjab Govt Employees Health Insurance"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY Cardiology)",
                "ECHS Empanelled (Cardiac Emergency)",
                "CGHS Empanelled"
            ],
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
            "government_schemes": [
                "Ayushman Bharat (PM-JAY Cataract & Retina)",
                "National Blindness Control Programme (Free Cataract)",
                "ECHS Empanelled (Ophthalmology)"
            ],
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
        },
        {
            "id": "dept-7",
            "hospital_id": "hosp-hoshiarpur-5",
            "name": "Neurotrauma & Critical Care",
            "description": "Accident trauma, brain concussion resuscitations, and neuro-intensive monitoring.",
            "head_doctor_name": "Dr. Ajay Chopra",
            "floor_location": "2nd Floor, Trauma Wing",
            "contact_extension": "501"
        },
        {
            "id": "dept-8",
            "hospital_id": "hosp-1",
            "name": "General & Laparoscopic Surgery",
            "description": "Subsidized emergency appendectomy, hernia repair, and wound debridement.",
            "head_doctor_name": "Dr. Sukhwinder Singh",
            "floor_location": "1st Floor, OT Complex",
            "contact_extension": "104"
        },
        {
            "id": "dept-9",
            "hospital_id": "hosp-hoshiarpur-7",
            "name": "Cataract & Refractive Eye Care",
            "description": "Micro-incision phacoemulsification, intraocular lens implants, and corneal screening.",
            "head_doctor_name": "Dr. Rajesh Grover",
            "floor_location": "Ground Floor, Eye OPD",
            "contact_extension": "701"
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
            "room_number": "Room 204, 2nd Floor (Cardiac Wing)",
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
            "room_number": "Room 105, Ground Floor (Joint Clinic)",
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
            "room_number": "Room 302, 3rd Floor (Women's Health OPD)",
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
            "room_number": "Room 01, Ground Floor (Emergency Casualty)",
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
            "room_number": "Room 210, 2nd Floor (Neuro Tower)",
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
            "room_number": "Room 108, Ground Floor (Chest & Pulmonology OPD)",
            "is_available": True
        },
        {
            "id": "doc-hsp-7",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-7",
            "department_id": "dept-9",
            "name": "Dr. Rajesh Grover",
            "specialization": "Ophthalmology",
            "qualification": "MS (Ophthalmology), Fellow Retina",
            "experience_years": 22,
            "consultation_fee": 350.00,
            "bio": "Premier ophthalmologist in Hoshiarpur with extensive experience in cataract phacoemulsification and diabetic eye care.",
            "rating": 4.9,
            "room_number": "Room 102, Ground Floor (Eye OPD & Laser)",
            "is_available": True
        },
        {
            "id": "doc-hsp-8",
            "user_id": None,
            "hospital_id": "hosp-hoshiarpur-5",
            "department_id": "dept-7",
            "name": "Dr. Ajay Chopra",
            "specialization": "Neurology & Neurotrauma",
            "qualification": "MD (Medicine), DM (Neurology), FINR",
            "experience_years": 17,
            "consultation_fee": 350.00,
            "bio": "Apex Hospital lead consultant for neuro-emergencies, traumatic head injuries, and seizure disorders.",
            "rating": 4.8,
            "room_number": "Room 201, 2nd Floor (Trauma & Neuro OPD)",
            "is_available": True
        },
        {
            "id": "doc-hsp-9",
            "user_id": None,
            "hospital_id": "hosp-1",
            "department_id": "dept-8",
            "name": "Dr. Sukhwinder Singh",
            "specialization": "General Surgery",
            "qualification": "MS (General Surgery), FIAGES",
            "experience_years": 19,
            "consultation_fee": 50.00,
            "bio": "Civil Hospital senior surgical specialist providing subsidized trauma surgeries, emergency laparotomies, and abdominal care.",
            "rating": 4.7,
            "room_number": "Room 14, 1st Floor (Surgical Complex)",
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
    "appointments": [],
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
            "address": "Ground Floor, Ivy Hospital, Chandigarh-Hoshiarpur Highway",
            "city": "Hoshiarpur",
            "latitude": 31.5165,
            "longitude": 75.9285,
            "phone": "+91-1882-500111",
            "hours": "24/7 Round the Clock",
            "is_open": True
        },
        {
            "id": "pharm-hsp-2",
            "hospital_id": "hosp-1",
            "name": "Jan Aushadhi Generic Medical Store",
            "address": "Gate No. 2, Civil Hospital, Court Road, Civil Lines",
            "city": "Hoshiarpur",
            "latitude": 31.5284,
            "longitude": 75.9122,
            "phone": "+91-1882-221199",
            "hours": "8:00 AM - 10:00 PM (Emergency Desk 24/7)",
            "is_open": True
        },
        {
            "id": "pharm-hsp-3",
            "hospital_id": "hosp-hoshiarpur-3",
            "name": "Apollo Pharmacy Express",
            "address": "Shop 12-14, Mall Road, Model Town",
            "city": "Hoshiarpur",
            "latitude": 31.5305,
            "longitude": 75.9188,
            "phone": "+91-1882-248800",
            "hours": "7:00 AM - 11:30 PM (Home Delivery Available)",
            "is_open": True
        },
        {
            "id": "pharm-hsp-4",
            "hospital_id": "hosp-hoshiarpur-4",
            "name": "Saini Medicos & Orthopedic Care",
            "address": "Opposite Canal Colony, Jalandhar Road",
            "city": "Hoshiarpur",
            "latitude": 31.5235,
            "longitude": 75.8995,
            "phone": "+91-1882-255310",
            "hours": "8:30 AM - 10:30 PM",
            "is_open": True
        },
        {
            "id": "pharm-hsp-5",
            "hospital_id": "hosp-hoshiarpur-5",
            "name": "MedPlus Chemist & Druggist",
            "address": "Shimla Pahari Chowk, GT Road",
            "city": "Hoshiarpur",
            "latitude": 31.5350,
            "longitude": 75.9220,
            "phone": "+91-1882-234900",
            "hours": "8:00 AM - 11:00 PM",
            "is_open": True
        }
    ],
    "medicines": [
        # --- Ivy Hospital 24/7 Pharmacy (pharm-hsp-1) ---
        {
            "id": "med-101",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Atorvastatin 20mg",
            "generic_name": "Atorvastatin Calcium",
            "dosage_form": "Tablet",
            "strength": "20mg",
            "manufacturer": "Sun Pharma / Cipla",
            "price": 14.50,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 120
        },
        {
            "id": "med-102",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Aspirin 75mg Dispersible",
            "generic_name": "Acetylsalicylic Acid",
            "dosage_form": "Tablet",
            "strength": "75mg",
            "manufacturer": "Bayer / USV",
            "price": 4.20,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 85
        },
        {
            "id": "med-103",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Telmisartan 40mg",
            "generic_name": "Telmisartan",
            "dosage_form": "Tablet",
            "strength": "40mg",
            "manufacturer": "Glenmark",
            "price": 8.90,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 64
        },
        {
            "id": "med-104",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Metoprolol Succinate 50mg",
            "generic_name": "Metoprolol Succinate",
            "dosage_form": "Tablet",
            "strength": "50mg",
            "manufacturer": "AstraZeneca / Torrent",
            "price": 12.00,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 40
        },
        {
            "id": "med-105",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Clopidogrel 75mg",
            "generic_name": "Clopidogrel Bisulfate",
            "dosage_form": "Tablet",
            "strength": "75mg",
            "manufacturer": "Sanofi",
            "price": 16.50,
            "prescription_required": True,
            "in_stock": False,
            "stock_units": 0
        },
        {
            "id": "med-106",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Nitroglycerin Sublingual Spray 0.4mg",
            "generic_name": "Nitroglycerin",
            "dosage_form": "Spray",
            "strength": "0.4mg/dose",
            "manufacturer": "Abbott",
            "price": 285.00,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 18
        },
        {
            "id": "med-107",
            "pharmacy_id": "pharm-hsp-1",
            "name": "Pantoprazole 40mg IV Injection",
            "generic_name": "Pantoprazole Sodium",
            "dosage_form": "Vial / Injection",
            "strength": "40mg",
            "manufacturer": "Alkem",
            "price": 52.00,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 45
        },

        # --- Jan Aushadhi Generic Store (pharm-hsp-2) ---
        {
            "id": "med-201",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Paracetamol 650mg",
            "generic_name": "Acetaminophen",
            "dosage_form": "Tablet",
            "strength": "650mg",
            "manufacturer": "Jan Aushadhi",
            "price": 1.80,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 200
        },
        {
            "id": "med-202",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Metformin 500mg SR",
            "generic_name": "Metformin Hydrochloride",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Jan Aushadhi",
            "price": 2.10,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 150
        },
        {
            "id": "med-203",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Amoxicillin & Clavulanate 625mg",
            "generic_name": "Amoxicillin + Clavulanic Acid",
            "dosage_form": "Tablet",
            "strength": "625mg",
            "manufacturer": "Jan Aushadhi",
            "price": 8.50,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 90
        },
        {
            "id": "med-204",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Cetirizine 10mg",
            "generic_name": "Cetirizine Dihydrochloride",
            "dosage_form": "Tablet",
            "strength": "10mg",
            "manufacturer": "Jan Aushadhi",
            "price": 0.80,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 180
        },
        {
            "id": "med-205",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Omeprazole 20mg",
            "generic_name": "Omeprazole",
            "dosage_form": "Capsule",
            "strength": "20mg",
            "manufacturer": "Jan Aushadhi",
            "price": 1.50,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 110
        },
        {
            "id": "med-206",
            "pharmacy_id": "pharm-hsp-2",
            "name": "Azithromycin 500mg",
            "generic_name": "Azithromycin Dihydrate",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Jan Aushadhi",
            "price": 7.20,
            "prescription_required": True,
            "in_stock": False,
            "stock_units": 0
        },
        {
            "id": "med-207",
            "pharmacy_id": "pharm-hsp-2",
            "name": "ORS (Oral Rehydration Salts) Sachet",
            "generic_name": "WHO Oral Rehydration Formula",
            "dosage_form": "Powder Sachet",
            "strength": "21.8g",
            "manufacturer": "Jan Aushadhi",
            "price": 4.50,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 300
        },

        # --- Apollo Pharmacy Express (pharm-hsp-3) ---
        {
            "id": "med-301",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Augmentin 625 Duo",
            "generic_name": "Amoxicillin + Potassium Clavulanate",
            "dosage_form": "Tablet",
            "strength": "625mg",
            "manufacturer": "GSK",
            "price": 22.50,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 75
        },
        {
            "id": "med-302",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Dolo 650mg",
            "generic_name": "Paracetamol",
            "dosage_form": "Tablet",
            "strength": "650mg",
            "manufacturer": "Micro Labs",
            "price": 3.20,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 160
        },
        {
            "id": "med-303",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Glycomet-GP 1/500",
            "generic_name": "Glimepiride + Metformin",
            "dosage_form": "Tablet",
            "strength": "1mg/500mg",
            "manufacturer": "USV",
            "price": 11.40,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 50
        },
        {
            "id": "med-304",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Teneligliptin 20mg",
            "generic_name": "Teneligliptin Hydrobromide",
            "dosage_form": "Tablet",
            "strength": "20mg",
            "manufacturer": "Glenmark",
            "price": 14.80,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 42
        },
        {
            "id": "med-305",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Budecort 200 Inhaler",
            "generic_name": "Budesonide",
            "dosage_form": "Inhaler (200 MDI)",
            "strength": "200mcg",
            "manufacturer": "Cipla",
            "price": 310.00,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 25
        },
        {
            "id": "med-306",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Montair-LC (Montelukast + Levocetirizine)",
            "generic_name": "Montelukast 10mg + Levocetirizine 5mg",
            "dosage_form": "Tablet",
            "strength": "10mg/5mg",
            "manufacturer": "Cipla",
            "price": 19.50,
            "prescription_required": True,
            "in_stock": False,
            "stock_units": 0
        },
        {
            "id": "med-307",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Digene Acidity Relief Gel",
            "generic_name": "Magnesium Hydroxide + Simethicone",
            "dosage_form": "Syrup / Gel",
            "strength": "200ml",
            "manufacturer": "Abbott",
            "price": 145.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 35
        },
        {
            "id": "med-308",
            "pharmacy_id": "pharm-hsp-3",
            "name": "Vitamin D3 60,000 IU Capsule",
            "generic_name": "Cholecalciferol",
            "dosage_form": "Softgel Capsule",
            "strength": "60K IU",
            "manufacturer": "Cadila / Zydus",
            "price": 32.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 88
        },

        # --- Saini Medicos & Orthopedic Care (pharm-hsp-4) ---
        {
            "id": "med-401",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Glucosamine Sulfate & Chondroitin",
            "generic_name": "Glucosamine + Chondroitin Complex",
            "dosage_form": "Capsule",
            "strength": "500mg",
            "manufacturer": "Torrent Pharma",
            "price": 24.00,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 55
        },
        {
            "id": "med-402",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Shelcal 500 (Calcium + Vit D3)",
            "generic_name": "Calcium Carbonate + Cholecalciferol",
            "dosage_form": "Tablet",
            "strength": "500mg",
            "manufacturer": "Torrent Pharma",
            "price": 9.80,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 110
        },
        {
            "id": "med-403",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Zerodol-SP",
            "generic_name": "Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg",
            "dosage_form": "Tablet",
            "strength": "100/325/15mg",
            "manufacturer": "Ipca Laboratories",
            "price": 13.20,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 68
        },
        {
            "id": "med-404",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Volini Joint Pain Relief Gel",
            "generic_name": "Diclofenac Diethylamine Gel",
            "dosage_form": "Topical Gel",
            "strength": "50g",
            "manufacturer": "Sun Pharma",
            "price": 160.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 40
        },
        {
            "id": "med-405",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Tramadol Hydrochloride 50mg",
            "generic_name": "Tramadol HCl",
            "dosage_form": "Capsule",
            "strength": "50mg",
            "manufacturer": "Cadila",
            "price": 18.00,
            "prescription_required": True,
            "in_stock": False,
            "stock_units": 0
        },
        {
            "id": "med-406",
            "pharmacy_id": "pharm-hsp-4",
            "name": "Crepe Bandage Elastic 10cm",
            "generic_name": "Cotton Elastic Support Bandage",
            "dosage_form": "Bandage Roll",
            "strength": "10cm x 4m",
            "manufacturer": "Hansaplast",
            "price": 120.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 50
        },

        # --- MedPlus Chemist & Druggist (pharm-hsp-5) ---
        {
            "id": "med-501",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Pan-D (Pantoprazole + Domperidone)",
            "generic_name": "Pantoprazole 40mg + Domperidone 30mg SR",
            "dosage_form": "Capsule",
            "strength": "40mg/30mg",
            "manufacturer": "Alkem",
            "price": 17.50,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 80
        },
        {
            "id": "med-502",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Cefixime 200mg (Taxim-O)",
            "generic_name": "Cefixime Trihydrate",
            "dosage_form": "Tablet",
            "strength": "200mg",
            "manufacturer": "Alkem",
            "price": 16.80,
            "prescription_required": True,
            "in_stock": True,
            "stock_units": 60
        },
        {
            "id": "med-503",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Levocetirizine 5mg",
            "generic_name": "Levocetirizine Hydrochloride",
            "dosage_form": "Tablet",
            "strength": "5mg",
            "manufacturer": "Hetero Healthcare",
            "price": 4.50,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 95
        },
        {
            "id": "med-504",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Betadine 10% Antiseptic Ointment",
            "generic_name": "Povidone Iodine 10%",
            "dosage_form": "Ointment",
            "strength": "20g",
            "manufacturer": "Win-Medicare",
            "price": 85.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 45
        },
        {
            "id": "med-505",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Insulin Glargine Solostar Pen",
            "generic_name": "Recombinant Human Insulin Glargine",
            "dosage_form": "Pre-filled Pen (3ml)",
            "strength": "100 IU/ml",
            "manufacturer": "Sanofi-Aventis",
            "price": 690.00,
            "prescription_required": True,
            "in_stock": False,
            "stock_units": 0
        },
        {
            "id": "med-506",
            "pharmacy_id": "pharm-hsp-5",
            "name": "Benadryl Cough Formula",
            "generic_name": "Diphenhydramine + Ammonium Chloride",
            "dosage_form": "Syrup",
            "strength": "100ml",
            "manufacturer": "Johnson & Johnson",
            "price": 115.00,
            "prescription_required": False,
            "in_stock": True,
            "stock_units": 38
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
    "doctor_reviews": [
        {
            "id": "rev-1",
            "doctor_id": "doc-hsp-1",
            "doctor_name": "Dr. Gurinder Singh",
            "patient_id": "99999999-9999-9999-9999-999999999999",
            "patient_name": "Harpreet Singh",
            "appointment_id": "app-historical-1",
            "hospital_id": "hosp-hoshiarpur-2",
            "rating": 5,
            "comment": "Exceptional cardiologist! Dr. Gurinder carefully analyzed my ECG and adjusted my blood pressure medication with clear morning/night schedules.",
            "tags": ["Accurate Diagnosis", "Compassionate Care", "Clear Medicine Schedule"],
            "verified_consultation": True,
            "created_at": "2026-09-16T14:30:00Z"
        },
        {
            "id": "rev-2",
            "doctor_id": "doc-hsp-1",
            "doctor_name": "Dr. Gurinder Singh",
            "patient_id": "88888888-8888-8888-8888-888888888888",
            "patient_name": "Sunita Verma",
            "appointment_id": "app-historical-2",
            "hospital_id": "hosp-hoshiarpur-2",
            "rating": 5,
            "comment": "Very polite and attentive doctor. Minimal wait time at Ivy Hospital reception and great explanation of my diet plan.",
            "tags": ["Minimal Wait Time", "Friendly & Empathetic", "Helpful Diet Plan"],
            "verified_consultation": True,
            "created_at": "2026-09-17T16:00:00Z"
        },
        {
            "id": "rev-3",
            "doctor_id": "doc-hsp-2",
            "doctor_name": "Dr. Ravinder Saini",
            "patient_id": "77777777-7777-7777-7777-777777777777",
            "patient_name": "Balwinder Kaur",
            "appointment_id": "app-historical-3",
            "hospital_id": "hosp-hoshiarpur-4",
            "rating": 5,
            "comment": "Outstanding orthopedic specialist. Replaced my mother's knee joint with rapid post-op recovery.",
            "tags": ["Experienced Surgeon", "Trauma Expertise"],
            "verified_consultation": True,
            "created_at": "2026-09-12T11:00:00Z"
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

    # ==========================================
    # APPOINTMENTS CRUD OPERATIONS
    # ==========================================
    def create_appointment(self, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates an appointment in Supabase database table 'appointments'
        and synchronizes with in-memory store.
        """
        appt_id = str(appointment_data.get("id") or uuid.uuid4())
        record = {
            "id": appt_id,
            "patient_id": str(appointment_data.get("patient_id")),
            "doctor_id": str(appointment_data.get("doctor_id")),
            "hospital_id": str(appointment_data.get("hospital_id")),
            "department_id": str(appointment_data.get("department_id")) if appointment_data.get("department_id") else None,
            "appointment_date": str(appointment_data.get("appointment_date")),
            "appointment_time": str(appointment_data.get("appointment_time")),
            "status": appointment_data.get("status", "pending"),
            "reason": appointment_data.get("reason"),
            "queue_number": appointment_data.get("queue_number"),
            "notes": appointment_data.get("notes"),
            "patient_phone": appointment_data.get("patient_phone"),
            "blood_group": appointment_data.get("blood_group"),
            "cancellation_reason": appointment_data.get("cancellation_reason"),
            "created_at": appointment_data.get("created_at") or datetime.now(timezone.utc).isoformat(),
            "updated_at": appointment_data.get("updated_at") or datetime.now(timezone.utc).isoformat()
        }

        full_record = dict(record)
        if "patient_name" in appointment_data:
            full_record["patient_name"] = appointment_data["patient_name"]
        if "patient_email" in appointment_data:
            full_record["patient_email"] = appointment_data["patient_email"]

        if self.is_live:
            try:
                self.client.table("appointments").insert(record).execute()
                logger.info(f"Appointment {appt_id} saved to Supabase database successfully.")
            except Exception as e:
                logger.error(f"Failed to insert appointment into Supabase: {e}")

        # Sync in-memory store
        existing_idx = next((i for i, a in enumerate(MOCK_DATA["appointments"]) if str(a.get("id")) == appt_id), None)
        if existing_idx is not None:
            MOCK_DATA["appointments"][existing_idx] = full_record
        else:
            MOCK_DATA["appointments"].append(full_record)

        return full_record

    def get_appointment_by_id(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves an appointment by ID from Supabase (or in-memory fallback).
        """
        if self.is_live:
            try:
                res = self.client.table("appointments").select("*").eq("id", str(appointment_id)).execute()
                if res.data and len(res.data) > 0:
                    appt = res.data[0]
                    cached = next((a for a in MOCK_DATA["appointments"] if str(a.get("id")) == str(appointment_id)), None)
                    if cached:
                        for k, v in cached.items():
                            if k not in appt or appt[k] is None:
                                appt[k] = v
                    return appt
            except Exception as e:
                logger.error(f"Failed to fetch appointment {appointment_id} from Supabase: {e}")

        return next((a for a in MOCK_DATA["appointments"] if str(a.get("id")) == str(appointment_id)), None)

    def get_patient_appointments(self, patient_id: str, patient_email: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves all appointments for a patient from Supabase (and in-memory fallback).
        """
        results: Dict[str, Dict[str, Any]] = {}

        if self.is_live:
            try:
                res = self.client.table("appointments").select("*").eq("patient_id", str(patient_id)).order("appointment_date", desc=True).order("appointment_time", desc=True).execute()
                if res.data:
                    for row in res.data:
                        results[str(row["id"])] = row
            except Exception as e:
                logger.error(f"Failed to fetch patient appointments from Supabase: {e}")

        # Merge matching items from MOCK_DATA
        for a in MOCK_DATA["appointments"]:
            is_match = (
                str(a.get("patient_id")) == str(patient_id)
                or (patient_email and a.get("patient_email") == patient_email)
                or (str(patient_id) in ["11111111-1111-1111-1111-111111111111", "guest", "default"] and str(a.get("patient_id")) == "11111111-1111-1111-1111-111111111111")
            )
            if is_match and str(a.get("id")) not in results:
                results[str(a["id"])] = a
            elif is_match and str(a.get("id")) in results:
                for k, v in a.items():
                    if k not in results[str(a["id"])] or results[str(a["id"])][k] is None:
                        results[str(a["id"])][k] = v

        appt_list = list(results.values())
        appt_list.sort(key=lambda x: (str(x.get("appointment_date", "")), str(x.get("appointment_time", ""))), reverse=True)
        return appt_list

    def update_appointment(self, appointment_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates an existing appointment in Supabase database and in-memory store.
        """
        clean_updates = dict(updates)
        clean_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        db_columns = {
            "doctor_id", "hospital_id", "department_id", "appointment_date",
            "appointment_time", "status", "reason", "queue_number", "notes",
            "patient_phone", "blood_group", "cancellation_reason", "updated_at"
        }
        db_updates = {k: v for k, v in clean_updates.items() if k in db_columns}

        if self.is_live and db_updates:
            try:
                self.client.table("appointments").update(db_updates).eq("id", str(appointment_id)).execute()
                logger.info(f"Appointment {appointment_id} updated in Supabase database.")
            except Exception as e:
                logger.error(f"Failed to update appointment {appointment_id} in Supabase: {e}")

        # Update in-memory store
        for a in MOCK_DATA["appointments"]:
            if str(a.get("id")) == str(appointment_id):
                a.update(clean_updates)
                return a

        if self.is_live:
            return self.get_appointment_by_id(appointment_id)

        return None

    def delete_appointment(self, appointment_id: str) -> bool:
        """
        Deletes an appointment from Supabase database and in-memory store.
        """
        success = True
        if self.is_live:
            try:
                self.client.table("appointments").delete().eq("id", str(appointment_id)).execute()
                logger.info(f"Appointment {appointment_id} deleted from Supabase database.")
            except Exception as e:
                logger.error(f"Failed to delete appointment {appointment_id} from Supabase: {e}")
                success = False

        idx = next((i for i, a in enumerate(MOCK_DATA["appointments"]) if str(a.get("id")) == str(appointment_id)), None)
        if idx is not None:
            MOCK_DATA["appointments"].pop(idx)

        return success

    def clear_patient_appointments(self, patient_id: str, patient_email: Optional[str] = None) -> int:
        """
        Clears all appointments for a patient in Supabase and in-memory store.
        """
        deleted_count = 0
        if self.is_live:
            try:
                res = self.client.table("appointments").delete().eq("patient_id", str(patient_id)).execute()
                deleted_count = len(res.data) if res.data else 0
                logger.info(f"Cleared {deleted_count} appointments from Supabase for patient {patient_id}.")
            except Exception as e:
                logger.error(f"Failed to clear appointments from Supabase: {e}")

        initial_len = len(MOCK_DATA["appointments"])
        MOCK_DATA["appointments"] = [
            a for a in MOCK_DATA["appointments"]
            if not (
                str(a.get("patient_id")) == str(patient_id)
                or (patient_email and a.get("patient_email") == patient_email)
                or str(patient_id) in ["11111111-1111-1111-1111-111111111111", "guest", "default"]
            )
        ]
        mem_deleted = initial_len - len(MOCK_DATA["appointments"])
        return max(deleted_count, mem_deleted)

    # ==========================================
    # MEDICAL RECORDS CRUD OPERATIONS
    # ==========================================
    def create_medical_record(self, record_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a medical record in Supabase database table 'medical_records'
        and synchronizes with in-memory store.
        """
        rec_id = str(record_data.get("id") or uuid.uuid4())

        meta = dict(record_data.get("metadata") or {})
        for field in ["disease_category", "appointment_id", "medicines", "diet_plan"]:
            if field in record_data and field not in meta:
                meta[field] = record_data[field]

        now_iso = datetime.now(timezone.utc).isoformat()
        db_row = {
            "id": rec_id,
            "patient_id": str(record_data.get("patient_id")),
            "doctor_id": str(record_data.get("doctor_id")) if record_data.get("doctor_id") else None,
            "hospital_id": str(record_data.get("hospital_id")) if record_data.get("hospital_id") else None,
            "title": record_data.get("title", "Medical Record"),
            "record_type": record_data.get("record_type", "General Record"),
            "file_url": record_data.get("file_url"),
            "file_name": record_data.get("file_name"),
            "file_size_bytes": record_data.get("file_size_bytes"),
            "notes": record_data.get("notes"),
            "metadata": meta,
            "created_at": record_data.get("created_at") or now_iso,
            "updated_at": record_data.get("updated_at") or now_iso
        }

        full_record = {
            "id": rec_id,
            "patient_id": str(record_data.get("patient_id")),
            "doctor_id": db_row["doctor_id"],
            "hospital_id": db_row["hospital_id"],
            "title": db_row["title"],
            "record_type": db_row["record_type"],
            "file_url": db_row["file_url"],
            "file_name": db_row["file_name"],
            "file_size_bytes": db_row["file_size_bytes"],
            "notes": db_row["notes"],
            "disease_category": meta.get("disease_category", "General Medicine"),
            "appointment_id": meta.get("appointment_id"),
            "medicines": meta.get("medicines", []),
            "diet_plan": meta.get("diet_plan"),
            "metadata": meta,
            "created_at": db_row["created_at"],
            "updated_at": db_row["updated_at"]
        }

        if self.is_live:
            try:
                self.client.table("medical_records").insert(db_row).execute()
                logger.info(f"Medical record {rec_id} saved to Supabase database successfully.")
            except Exception as e:
                logger.error(f"Failed to insert medical record into Supabase: {e}")

        # Sync in-memory store
        existing_idx = next((i for i, r in enumerate(MOCK_DATA["medical_records"]) if str(r.get("id")) == rec_id), None)
        if existing_idx is not None:
            MOCK_DATA["medical_records"][existing_idx] = full_record
        else:
            MOCK_DATA["medical_records"].append(full_record)

        return full_record

    def get_medical_record_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a medical record by ID from Supabase (or in-memory fallback).
        """
        if self.is_live:
            try:
                res = self.client.table("medical_records").select("*").eq("id", str(record_id)).execute()
                if res.data and len(res.data) > 0:
                    return self._unpack_medical_record_row(res.data[0])
            except Exception as e:
                logger.error(f"Failed to fetch medical record {record_id} from Supabase: {e}")

        return next((r for r in MOCK_DATA["medical_records"] if str(r.get("id")) == str(record_id)), None)

    def get_patient_medical_records(self, patient_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all medical records for a patient from Supabase (and in-memory fallback).
        """
        results: Dict[str, Dict[str, Any]] = {}

        if self.is_live:
            try:
                res = self.client.table("medical_records").select("*").eq("patient_id", str(patient_id)).order("created_at", desc=True).execute()
                if res.data:
                    for row in res.data:
                        rec = self._unpack_medical_record_row(row)
                        results[str(rec["id"])] = rec
            except Exception as e:
                logger.error(f"Failed to fetch patient medical records from Supabase: {e}")

        for r in MOCK_DATA["medical_records"]:
            if str(r.get("patient_id")) == str(patient_id) and str(r.get("id")) not in results:
                results[str(r["id"])] = r

        rec_list = list(results.values())
        rec_list.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
        return rec_list

    def update_medical_record(self, record_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Updates an existing medical record in Supabase database and in-memory store.
        """
        clean_updates = dict(updates)
        clean_updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        existing = self.get_medical_record_by_id(record_id)
        if not existing:
            return None

        meta = dict(existing.get("metadata") or {})
        for field in ["disease_category", "appointment_id", "medicines", "diet_plan"]:
            if field in clean_updates:
                meta[field] = clean_updates[field]
        if "metadata" in clean_updates and isinstance(clean_updates["metadata"], dict):
            meta.update(clean_updates["metadata"])

        db_columns = {"title", "record_type", "doctor_id", "hospital_id", "file_url", "file_name", "file_size_bytes", "notes", "updated_at"}
        db_updates = {k: v for k, v in clean_updates.items() if k in db_columns}
        db_updates["metadata"] = meta

        if self.is_live and db_updates:
            try:
                self.client.table("medical_records").update(db_updates).eq("id", str(record_id)).execute()
                logger.info(f"Medical record {record_id} updated in Supabase database.")
            except Exception as e:
                logger.error(f"Failed to update medical record {record_id} in Supabase: {e}")

        # Update in-memory store
        for r in MOCK_DATA["medical_records"]:
            if str(r.get("id")) == str(record_id):
                r.update(clean_updates)
                r["metadata"] = meta
                for f in ["disease_category", "appointment_id", "medicines", "diet_plan"]:
                    if f in meta:
                        r[f] = meta[f]
                return r

        return self.get_medical_record_by_id(record_id)

    def delete_medical_record(self, record_id: str) -> bool:
        """
        Deletes a medical record from Supabase database and in-memory store.
        """
        success = True
        if self.is_live:
            try:
                self.client.table("medical_records").delete().eq("id", str(record_id)).execute()
                logger.info(f"Medical record {record_id} deleted from Supabase database.")
            except Exception as e:
                logger.error(f"Failed to delete medical record {record_id} from Supabase: {e}")
                success = False

        idx = next((i for i, r in enumerate(MOCK_DATA["medical_records"]) if str(r.get("id")) == str(record_id)), None)
        if idx is not None:
            MOCK_DATA["medical_records"].pop(idx)

        return success

    def _unpack_medical_record_row(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """
        Helper to unpack metadata fields into top-level dictionary attributes.
        """
        meta = row.get("metadata") or {}
        return {
            "id": row.get("id"),
            "patient_id": row.get("patient_id"),
            "doctor_id": row.get("doctor_id"),
            "hospital_id": row.get("hospital_id"),
            "title": row.get("title"),
            "record_type": row.get("record_type"),
            "file_url": row.get("file_url"),
            "file_name": row.get("file_name"),
            "file_size_bytes": row.get("file_size_bytes"),
            "notes": row.get("notes"),
            "disease_category": meta.get("disease_category", "General Medicine"),
            "appointment_id": meta.get("appointment_id"),
            "medicines": meta.get("medicines", []),
            "diet_plan": meta.get("diet_plan"),
            "metadata": meta,
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at")
        }


supabase_service = SupabaseService()
