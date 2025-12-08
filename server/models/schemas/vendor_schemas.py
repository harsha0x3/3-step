from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Literal


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


class VendorSearchParams(BaseModel):
    search_by: Literal["id", "vendor_name"] | None = None
    search_term: str | None = None
    page: int = 1
    page_size: int = 15
    sort_by: Literal["created_at", "updated_at", "vendor_name"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"


class VendorSpocSearchParams(BaseModel):
    search_by: (
        Literal["id", "full_name", "email", "mobile_number", "vendor_name"] | None
    ) = None
    search_term: str | None = None
    page: int = 1
    page_size: int = 15
    sort_by: Literal["created_at", "updated_at", "full_name"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
    vendor_id: str | None = None
