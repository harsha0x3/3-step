from enum import Enum
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class RoleEnum(str, Enum):
    super_admin = "super_admin"
    admin = "admin"
    store_agent = "store_agent"
    verifier = "registration_officer"


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: RoleEnum


class LoginRequest(BaseModel):
    email_or_username: EmailStr | str
    password: str
    mfa_code: str | None = None


class Tokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class LoginResponse(BaseModel):
    requires_mfa: bool
    challenge_token: str | None = None
    tokens: Tokens | None | None


class MFAVerifyRequest(BaseModel):
    otpauth_uri: str
    qr_png_base64: str


class MFARecoveryVerifyRequest(BaseModel):
    recovery_code: str


class MFASetupVerifyResponse(BaseModel):
    enabled: bool
    recovery_codes: list[str]


class UserOut(BaseModel):
    id: str
    username: str
    email: str
    full_name: str | None = None
    role: str
    store_id: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
