from pydantic import BaseModel, ConfigDict
from typing import Literal
from .store_schemas import StoreItemOut
from datetime import date
from .auth_schemas import UserOut
from .region_schemas import RegionOutSchema


class NewCandidatePayload(BaseModel):
    id: str
    full_name: str
    mobile_number: str | None = None
    dob: date | None = None
    city: str
    state: str
    division: str
    aadhar_number: str | None = None

    region_id: str | None = None

    store_id: str | None = None


class UpdatedCandidatePayload(BaseModel):
    id: str | None = None
    full_name: str | None = None
    mobile_number: str | None = None
    dob: date | None = None
    city: str | None = None
    state: str | None = None
    division: str | None = None
    aadhar_number: str | None = None
    region_id: str | None = None

    is_candidate_verified: bool | None = None
    store_id: str | None = None
    vendor_spoc_id: str | None = None


class CandidatesSearchParams(BaseModel):
    search_by: Literal["id", "full_name"] | None = None
    search_term: str | None = None
    page: int = 1
    page_size: int = 15
    sort_by: Literal["created_at", "updated_at", "full_name"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"
    store_id: str | None = None
    is_verified: bool | None = None
    is_issued: bool | None = None

    upgrade_request: bool | None = None


class CandidateItemWithStore(BaseModel):
    id: str
    coupon_code: str
    full_name: str
    mobile_number: str | None = None
    dob: date | None = None
    city: str | None = None
    state: str | None = None
    photo: str | None = None
    issued_status: str | None = None
    division: str | None = None
    vendor_spoc_id: str | None = None
    region: RegionOutSchema | None

    aadhar_number: str | None = None
    aadhar_photo: str | None = None

    gift_card_code: str | None = None

    store_id: str | None = None
    is_candidate_verified: bool

    store: StoreItemOut | None = None
    verified_by: UserOut | None = None


class PartialCandidateItem(BaseModel):
    id: str
    full_name: str
    mobile_number: str | None = None
    issued_status: str | None = None
    is_candidate_verified: bool
    is_requested_for_upgrade: bool
    photo: str | None
    store: StoreItemOut | None = None

    scheduled_at: date | None
    upgrade_product_info: str | None
    cost_of_upgrade: int | None


class CandidateOut(BaseModel):
    id: str
    coupon_code: str
    full_name: str
    mobile_number: str
    dob: date | None = None
    city: str | None = None
    state: str | None = None
    photo: str | None = None
    issued_status: str | None = None
    division: str | None = None
    region: RegionOutSchema | None

    aadhar_number: str | None = None
    aadhar_photo: str | None = None

    store_id: str | None = None
    vendor_spoc_id: str | None = None

    gift_card_code: str | None = None

    is_candidate_verified: bool

    model_config = ConfigDict(from_attributes=True)
