from pydantic import BaseModel, EmailStr


class CandidateInOtp(BaseModel):
    otp: str
    candidate_name: str
    candidate_email: str
    expiry_minutes: str
    store_name: str
    store_address_line: str
    store_city: str
    support_email: str
    support_phone: str


class OtpVerifyRequest(BaseModel):
    otp: str


class AdminOTPPayload(BaseModel):
    otp: str
    expiry_minutes: str

    beneficiary_id: str
    beneficiary_name: str
    beneficiary_phone: str

    store_name: str
    store_address: str

    support_email: EmailStr | None = None
    support_phone: str | None = None
