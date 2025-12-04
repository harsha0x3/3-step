from pydantic import BaseModel, ConfigDict
from .auth_schemas import UserOut
from datetime import datetime


class IsuedStatusItem(BaseModel):
    candidate_id: str
    issued_status: str
    issued_at: datetime | None = None
    issued_laptop_serial: str | None = None
    evidence_photo: str | None = None
    bill_reciept: str | None = None
    store_employee_name: str | None = None
    store_employee_mobile: str | None = None
    store_employee_photo: str | None = None

    issued_user: UserOut | None = None

    model_config = ConfigDict(from_attributes=True)


class LatestIssuer(BaseModel):
    store_employee_name: str | None = None
    store_employee_mobile: str | None = None
    store_employee_photo: str | None = None
    model_config = ConfigDict(from_attributes=True)


class VerificaionStatusItem(BaseModel):
    candidate_id: str
    is_otp_verified: bool = False
    is_facial_verified: bool = False
    is_coupon_verified: bool = False
    is_aadhar_verified: bool = False
    coupon_verified_at: datetime | None = None
    otp_verified_at: datetime | None = None
    facial_verified_at: datetime | None = None
    aadhar_verified_at: datetime | None = None
    uploaded_candidate_photo: str | None = None
    entered_aadhar_number: str | None = None
    created_at: datetime
    updated_at: datetime
    overriding_user: str | None = None
    overriding_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)


class LaptopIssueRequest(BaseModel):
    laptop_serial: str
    evidence_photo: str
    bill_reciept: str
    store_employee_photo: str
    store_employee_name: str
    store_employee_mobile: str


class ConsolidateVerificationRequest(BaseModel):
    coupon_code: str
    candidate_photo: str
    aadhar_number: str


class ConsolidateVerificationResponse(BaseModel):
    is_all_verified: bool = False
    is_coupon_verified: bool = False
    is_facial_verified: bool = False
    is_aadhar_verified: bool = False


class OverridingRequest(BaseModel):
    overriding_reason: str
