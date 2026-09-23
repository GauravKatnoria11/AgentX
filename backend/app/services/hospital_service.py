import math
from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


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
            if city and city.lower() not in h["city"].lower() and city.lower() != "springfield":
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

            h_dict = dict(h)
            if user_lat is not None and user_lon is not None:
                h_dict["distance_km"] = calculate_haversine_distance(
                    user_lat, user_lon, h["latitude"], h["longitude"]
                )
            filtered.append(h_dict)

        if user_lat is not None and user_lon is not None:
            filtered.sort(key=lambda x: x.get("distance_km", 9999))

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
        res = dict(hospital)
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
                item = dict(h)
                if user_lat is not None and user_lon is not None:
                    item["distance_km"] = calculate_haversine_distance(user_lat, user_lon, h["latitude"], h["longitude"])
                results.append(item)

        if user_lat is not None and user_lon is not None:
            results.sort(key=lambda x: x.get("distance_km", 9999))

        return results


hospital_service = HospitalService()
