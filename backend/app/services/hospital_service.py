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
        emergency_only: bool = False,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        hospitals = MOCK_DATA["hospitals"]
        filtered = []

        for h in hospitals:
            if city and city.lower() not in h["city"].lower():
                continue
            if hospital_type and hospital_type.lower() not in h["type"].lower():
                continue
            if emergency_only and not h.get("emergency_available"):
                continue
            if service:
                matched_service = any(service.lower() in s.lower() for s in h.get("services", []))
                if not matched_service:
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
        hospital = next((h for h in MOCK_DATA["hospitals"] if str(h["id"]) == str(hospital_id)), None)
        if not hospital:
            return None
        res = dict(hospital)
        res["departments"] = [d for d in MOCK_DATA["departments"] if str(d["hospital_id"]) == str(hospital_id)]
        res["doctors"] = [d for d in MOCK_DATA["doctors"] if str(d["hospital_id"]) == str(hospital_id)]
        return res

    def search_hospitals(self, query: str, user_lat: Optional[float] = None, user_lon: Optional[float] = None) -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        for h in MOCK_DATA["hospitals"]:
            h_match = (
                query_lower in h["name"].lower() or
                query_lower in h["city"].lower() or
                query_lower in h.get("address", "").lower() or
                any(query_lower in s.lower() for s in h.get("services", []))
            )
            if h_match:
                item = dict(h)
                if user_lat is not None and user_lon is not None:
                    item["distance_km"] = calculate_haversine_distance(user_lat, user_lon, h["latitude"], h["longitude"])
                results.append(item)
        return results


hospital_service = HospitalService()
