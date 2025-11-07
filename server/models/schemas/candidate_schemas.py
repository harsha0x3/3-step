from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import Literal
from .store_schemas import StoreItemWithUser


class NewCandidatePayload(BaseModel):
    full_name: str
    gender: str
    dob: date
    aadhar_number: str
    mobile_number: str
    email: str
    disability_type: str
    address: str
    city: str
    state: str
    store_id: str
    parent_name: str
    parent_employee_code: str
    parent_mobile_number: str
    parent_email: str
    parent_relation: str
    is_candidate_verified: bool


class UpdatedCandidatePayload(BaseModel):
    full_name: str | None = None
    gender: str | None = None
    dob: date | None = None
    mobile_number: str | None = None
    email: str | None = None
    disability_type: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    store_id: str | None = None
    parent_name: str | None = None
    parent_employee_code: str | None = None
    parent_mobile_number: str | None = None
    parent_email: str | None = None
    parent_photo_url: str | None = None
    parent_relation: str | None = None
    is_candidate_verified: bool | None = None


class CandidatesSearchParams(BaseModel):
    search_by: Literal["id", "full_name", "aadhar_last_four_digits"] | None = None
    search_term: str | None = None


class CandidateItemWithStore(BaseModel):
    id: str
    full_name: str
    gender: str
    dob: date
    aadhar_last_four_digits: str
    mobile_number: str
    email: str
    disability_type: str
    address: str
    city: str
    state: str
    photo_url: str | None = None
    store_id: str
    issued_status: str
    parent_name: str | None = None
    parent_employee_code: str | None = None
    parent_mobile_number: str | None = None
    parent_email: str | None = None
    parent_photo_url: str | None = None
    parent_relation: str | None = None
    is_candidate_verified: bool

    coupon: str | None = None

    store_with_user: StoreItemWithUser | None = None


class CandidateOut(BaseModel):
    id: str
    full_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)
