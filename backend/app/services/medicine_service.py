from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


class MedicineService:
    def get_medicines(
        self,
        pharmacy_id: Optional[str] = None,
        search: Optional[str] = None,
        in_stock_only: bool = True
    ) -> List[Dict[str, Any]]:
        results = []
        for m in MOCK_DATA["medicines"]:
            if pharmacy_id and str(m.get("pharmacy_id")) != str(pharmacy_id):
                continue
            if in_stock_only and not m.get("in_stock", True):
                continue
            if search:
                s = search.lower()
                matched = (
                    s in m["name"].lower() or
                    s in (m.get("generic_name") or "").lower() or
                    s in (m.get("manufacturer") or "").lower()
                )
                if not matched:
                    continue

            m_dict = dict(m)
            pharm = next((p for p in MOCK_DATA["pharmacies"] if str(p["id"]) == str(m.get("pharmacy_id"))), None)
            m_dict["pharmacy_name"] = pharm["name"] if pharm else "Partner Pharmacy"
            results.append(m_dict)
        return results

    def get_medicine_by_id(self, medicine_id: str) -> Optional[Dict[str, Any]]:
        med = next((m for m in MOCK_DATA["medicines"] if str(m["id"]) == str(medicine_id)), None)
        if not med:
            return None
        res = dict(med)
        pharm = next((p for p in MOCK_DATA["pharmacies"] if str(p["id"]) == str(med.get("pharmacy_id"))), None)
        res["pharmacy_name"] = pharm["name"] if pharm else "Partner Pharmacy"
        return res


medicine_service = MedicineService()
