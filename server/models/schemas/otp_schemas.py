from pydantic import BaseModel


class CandidateInOtp(BaseModel):
    otp: str
    candidate_name: str
    candidate_email: str
    expiry_minutes: str
    store_name: str
    store_address_line: str
    store_city: str
    store_state: str
    support_email: str
    support_phone: str


class OtpVerifyRequest(BaseModel):
    otp: str
