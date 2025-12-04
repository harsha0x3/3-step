from pydantic import BaseModel, ConfigDict
from datetime import datetime


class NewVendor(BaseModel):
    vendor_name: str
    vendor_owner: str | None
    mobile_number: str | None = None
    email: str | None = None


class UpdateVendor(BaseModel):
    vendor_name: str | None = None
    vendor_owner: str | None = None
    mobile_number: str | None = None
    email: str | None = None


class NewVendorSpoc(BaseModel):
    vendor_id: str
    full_name: str
    mobile_number: str | None = None
    email: str | None = None


class UpdateVendorSpoc(BaseModel):
    vendor_id: str | None = None
    full_name: str | None = None
    mobile_number: str | None = None
    email: str | None = None


class VendorItem(BaseModel):
    id: str
    vendor_name: str
    vendor_owner: str | None = None
    mobile_number: str | None = None
    email: str | None = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VendorSpocItem(BaseModel):
    id: str
    vendor_id: str
    full_name: str
    mobile_number: str | None = None
    email: str | None = None
    photo: str | None = None
    vendor: VendorItem
