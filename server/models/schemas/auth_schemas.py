from enum import Enum
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class RoleEnum(str, Enum):
    super_admin = "super_admin"
    admin = "admin"
    store_agent = "store_agent"
    verifier = "registration_officer"


class RegisterRequest(BaseModel):
    email: EmailStr | None = None
    mobile_number: str | None = None
    password: str
    full_name: str
    role: RoleEnum


class LoginRequest(BaseModel):
    email_or_mobile_number: EmailStr | str
    password: str
    mfa_code: str | None = None


class Tokens(BaseModel):
    lt_access_token: str
    lt_refresh_token: str
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
    mobile_number: str | None = None
    email: str | None = None
    full_name: str | None = None
    role: str
    store_id: str | None = None
    location: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


# Add these new schemas


class AdminCreateUserRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str
    mobile_number: str | None = None
    role: RoleEnum
    location: str | None = None
    store_id: str | None = None  # Required for store_agent role


class AdminUpdateUserRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: RoleEnum | None = None
    store_id: str | None = None
    is_active: bool | None = None
    location: str | None = None
    mobile_number: str | None = None


class PasswordResetRequestSchema(BaseModel):
    email: EmailStr | None = None
    mobile_number: str | None = None


class PasswordResetVerifySchema(BaseModel):
    email: EmailStr | None = None
    mobile_number: str | None = None
    otp: str
    new_password: str


class PasswordChangeSchema(BaseModel):
    current_password: str
    new_password: str


class UserDetailOut(BaseModel):
    id: str
    email: str | None = None
    mobile_number: str | None = None
    full_name: str | None = None
    role: str
    store_id: str | None = None
    is_active: bool
    is_first_login: bool
    must_change_password: bool
    location: str | None = None
    mfa_enabled: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
