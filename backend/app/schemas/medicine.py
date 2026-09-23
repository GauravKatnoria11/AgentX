from typing import Optional
from pydantic import BaseModel


class MedicineBase(BaseModel):
    pharmacy_id: Optional[str] = None
    name: str
    generic_name: Optional[str] = None
    dosage_form: Optional[str] = "Tablet"
    strength: Optional[str] = None
    manufacturer: Optional[str] = None
    price: float = 0.0
    prescription_required: bool = False
    in_stock: bool = True
    stock_units: Optional[int] = 0


class MedicineCreate(MedicineBase):
    pass


class MedicineResponse(MedicineBase):
    id: str
    pharmacy_name: Optional[str] = None
    created_at: Optional[str] = None
