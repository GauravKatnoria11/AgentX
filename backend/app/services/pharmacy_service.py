from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA
from app.services.hospital_service import calculate_haversine_distance


class PharmacyService:
    def get_pharmacies(
        self,
        city: Optional[str] = None,
        search: Optional[str] = None,
        open_only: bool = False,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for p in MOCK_DATA["pharmacies"]:
            if city and city.lower() not in p["city"].lower():
                continue
            if open_only and not p.get("is_open", True):
                continue
            if search:
                s = search.lower()
                matched = s in p["name"].lower() or s in p["address"].lower()
                if not matched:
                    continue

            p_dict = dict(p)
            if user_lat is not None and user_lon is not None and p.get("latitude") and p.get("longitude"):
                p_dict["distance_km"] = calculate_haversine_distance(
                    user_lat, user_lon, p["latitude"], p["longitude"]
                )
            results.append(p_dict)

        if user_lat is not None and user_lon is not None:
            results.sort(key=lambda x: x.get("distance_km", 9999))

        return results

    def get_pharmacy_by_id(self, pharmacy_id: str) -> Optional[Dict[str, Any]]:
        return next((p for p in MOCK_DATA["pharmacies"] if str(p["id"]) == str(pharmacy_id)), None)


pharmacy_service = PharmacyService()
