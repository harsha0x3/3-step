from pydantic import BaseModel, ConfigDict
from typing import Literal
from .store_schemas import StoreItemWithUser


class NewCandidatePayload(BaseModel):
    full_name: str
    gender: str
    aadhar_number: str
    mobile_number: str | None = None
    email: str | None = None
    address: str

    store_id: str | None = None


class UpdatedCandidatePayload(BaseModel):
    coupon_code: str | None = None
    full_name: str | None = None
    gender: str | None = None
    aadhar_number: str | None = None
    mobile_number: str | None = None
    email: str | None = None
    address: str | None = None
    store_id: str | None = None
    vendor_id: str | None = None
    is_candidate_verified: bool | None = None


class CandidatesSearchParams(BaseModel):
    search_by: Literal["id", "full_name", "aadhar_last_four_digits"] | None = None
    search_term: str | None = None


class CandidateItemWithStore(BaseModel):
    id: str
    coupon_code: str | None = None
    full_name: str | None = None
    gender: str
    aadhar_number: str | None = None
    mobile_number: str | None = None
    email: str | None = None
    address: str
    photo: str | None = None
    issued_status: str

    store_id: str | None = None
    vendor_id: str | None = None

    is_candidate_verified: bool | None = None

    store_with_user: StoreItemWithUser | None = None


class CandidateOut(BaseModel):
    id: str
    coupon_code: str | None = None
    full_name: str | None = None
    gender: str
    aadhar_number: str | None = None
    mobile_number: str | None = None
    email: str | None = None
    address: str
    photo: str | None = None
    issued_status: str | None = "not_issued"

    store_id: str | None = None
    vendor_id: str | None = None

    is_candidate_verified: bool | None = None

    model_config = ConfigDict(from_attributes=True)
