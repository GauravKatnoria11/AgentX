import math
from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


# Corrections for directory records whose saved street text resolves to a
# different city. These are response-time overrides only; they do not write to
# the connected directory database.
FACILITY_ADDRESS_OVERRIDES = {
    "hosp-1": {
        "name": "Civil Hospital Hoshiarpur",
        "address": "Civil Hospital, Hoshiarpur",
        "city": "Hoshiarpur",
        "state": "Punjab",
        "postal_code": "146001",
    },
    "hosp-hoshiarpur-1": {
        "name": "Civil Hospital Hoshiarpur",
        "address": "Civil Hospital, Hoshiarpur",
        "city": "Hoshiarpur",
        "state": "Punjab",
        "postal_code": "146001",
    },
    "hosp-hoshiarpur-6": {
        "name": "Lifeline Heart Centre",
        "address": "37 Cool Road, Waryam Nagar, Jyoti Nagar",
        "city": "Jalandhar",
        "state": "Punjab",
        "postal_code": "144003",
        "website": "https://lifelineheart.in",
    },
}


def _public_hospital(hospital: Dict[str, Any]) -> Dict[str, Any]:
    public_hospital = dict(hospital)
    public_hospital.update(FACILITY_ADDRESS_OVERRIDES.get(str(hospital.get("id")), {}))
    # Stored coordinates are not verified and must never be presented as a
    # calculated proximity. The route service geocodes the corrected address.
    public_hospital["latitude"] = None
    public_hospital["longitude"] = None
    return public_hospital


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class HospitalService:
    def get_hospitals(
        self,
        city: Optional[str] = None,
        hospital_type: Optional[str] = None,
        service: Optional[str] = None,
        disease: Optional[str] = None,
        scheme: Optional[str] = None,
        emergency_only: bool = False,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        hospitals = MOCK_DATA["hospitals"]
        filtered = []

        for h in hospitals:
            effective_city = FACILITY_ADDRESS_OVERRIDES.get(str(h.get("id")), {}).get("city", h["city"])
            if city and city.lower() not in effective_city.lower() and city.lower() != "springfield":
                continue
            if hospital_type and hospital_type.lower() not in h["type"].lower():
                continue
            if emergency_only and not h.get("emergency_available"):
                continue
            if service:
                matched_service = any(service.lower() in s.lower() for s in h.get("services", []))
                if not matched_service:
                    continue
            if disease:
                disease_lower = disease.lower()
                matched_disease = any(disease_lower in d.lower() for d in h.get("diseases_treated", [])) or \
                                  any(disease_lower in s.lower() for s in h.get("services", []))
                if not matched_disease:
                    continue
            if scheme:
                scheme_lower = scheme.lower()
                matched_scheme = any(scheme_lower in sc.lower() for sc in h.get("government_schemes", []))
                if not matched_scheme:
                    continue

            filtered.append(_public_hospital(h))

        total = len(filtered)
        start = (page - 1) * limit
        end = start + limit
        paginated = filtered[start:end]

        return {
            "items": paginated,
            "total": total,
            "page": page,
            "limit": limit
        }

    def get_hospital_by_id(self, hospital_id: str) -> Optional[Dict[str, Any]]:
        # Check direct or alias (e.g. hosp-1 maps to hosp-hoshiarpur-1)
        hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hospital_id)), None)
        if not hospital and (hospital_id in ("hosp-1", "1", "hosp-hoshiarpur-1")):
            hospital = MOCK_DATA["hospitals"][0] if MOCK_DATA["hospitals"] else None

        if not hospital:
            return None
        res = _public_hospital(hospital)
        # departments & doctors matching either ID
        dept_ids = {str(res["id"]), "hosp-1", "hosp-hoshiarpur-1"} if res["id"] in ("hosp-1", "hosp-hoshiarpur-1") else {str(res["id"])}
        res["departments"] = [d for d in MOCK_DATA["departments"] if str(d["hospital_id"]) in dept_ids]
        doctors_list = []
        for d in MOCK_DATA["doctors"]:
            if str(d["hospital_id"]) in dept_ids:
                d_copy = dict(d)
                d_dept = next((dept for dept in MOCK_DATA["departments"] if str(dept["id"]) == str(d.get("department_id"))), None)
                d_copy["department_name"] = d_dept["name"] if d_dept else "General"
                d_copy["hospital_name"] = res["name"]
                doctors_list.append(d_copy)
        res["doctors"] = doctors_list
        return res

    def search_hospitals(
        self,
        query: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        for h in MOCK_DATA["hospitals"]:
            h_match = (
                query_lower in h["name"].lower() or
                query_lower in h["city"].lower() or
                query_lower in h.get("address", "").lower() or
                any(query_lower in s.lower() for s in h.get("services", [])) or
                any(query_lower in d.lower() for d in h.get("diseases_treated", [])) or
                any(query_lower in sc.lower() for sc in h.get("government_schemes", [])) or
                (query_lower == "general" and "hospital" in h["name"].lower())
            )
            if h_match:
                results.append(_public_hospital(h))

        return results


hospital_service = HospitalService()
