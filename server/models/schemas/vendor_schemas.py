from pydantic import BaseModel, ConfigDict
from datetime import datetime


class NewVendor(BaseModel):
    vendor_name: str
    location: str
    contact: str


class NewVendorSpoc(BaseModel):
    vendor_id: str
    full_name: str
    contact: str


class VendorItem(BaseModel):
    id: str
    vendor_name: str
    location: str
    contact: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VendorSpocItem(BaseModel):
    id: str
    vendor_id: str
    full_name: str
    contact: str
    photo: str
    vendor: VendorItem
