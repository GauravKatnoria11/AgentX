from typing import List, Dict, Any, Optional
from app.supabase import MOCK_DATA


class DepartmentService:
    def get_departments(self, hospital_id: Optional[str] = None) -> List[Dict[str, Any]]:
        depts = MOCK_DATA["departments"]
        if hospital_id:
            return [d for d in depts if str(d.get("hospital_id")) == str(hospital_id)]
        return depts

    def get_department_by_id(self, dept_id: str) -> Optional[Dict[str, Any]]:
        dept = next((d for d in MOCK_DATA["departments"] if str(d["id"]) == str(dept_id)), None)
        if not dept:
            return None
        res = dict(dept)
        res["doctors"] = [doc for doc in MOCK_DATA["doctors"] if str(doc.get("department_id")) == str(dept_id)]
        return res


department_service = DepartmentService()
