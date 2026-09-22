from typing import Optional
from pydantic import BaseModel


class DepartmentBase(BaseModel):
    hospital_id: str
    name: str
    description: Optional[str] = None
    head_doctor_name: Optional[str] = None
    floor_location: Optional[str] = None
    contact_extension: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentResponse(DepartmentBase):
    id: str
    created_at: Optional[str] = None
