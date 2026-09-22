from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA
from app.services.hospital_service import calculate_haversine_distance


class LabService:
    def get_labs(
        self,
        city: Optional[str] = None,
        test_type: Optional[str] = None,
        search: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for lab in MOCK_DATA["labs"]:
            if city and city.lower() not in lab["city"].lower():
                continue
            if test_type:
                matched_test = any(test_type.lower() in t.lower() for t in lab.get("test_types", []))
                if not matched_test:
                    continue
            if search:
                s = search.lower()
                matched = (
                    s in lab["name"].lower() or
                    s in lab["city"].lower() or
                    any(s in t.lower() for t in lab.get("test_types", []))
                )
                if not matched:
                    continue

            l_dict = dict(lab)
            if user_lat is not None and user_lon is not None and lab.get("latitude") and lab.get("longitude"):
                l_dict["distance_km"] = calculate_haversine_distance(
                    user_lat, user_lon, lab["latitude"], lab["longitude"]
                )
            results.append(l_dict)

        if user_lat is not None and user_lon is not None:
            results.sort(key=lambda x: x.get("distance_km", 9999))

        return results

    def get_lab_by_id(self, lab_id: str) -> Optional[Dict[str, Any]]:
        return next((l for l in MOCK_DATA["labs"] if str(l["id"]) == str(lab_id)), None)


lab_service = LabService()
