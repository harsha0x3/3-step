from typing import Annotated, Any
from fastapi import HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from services.auth.csrf_handler import set_csrf_cookie
from services.auth.jwt_handler import (
    create_tokens,
    set_jwt_cookies,
    verify_refresh_token,
)
from models.schemas.auth_schemas import LoginRequest, RegisterRequest, UserDetailOut
from models.users import User
import asyncio
from services.auth.captcha import verify_turnstile_token


def register_user(
    reg_user: RegisterRequest, db: Session, response: Response
) -> dict[str, Any]:
    existing_user = db.scalar(
        select(User).where(
            or_(
                User.mobile_number == reg_user.mobile_number,
                User.email == reg_user.email,
            )
        )
    )
    if existing_user:
        if existing_user.mobile_number == reg_user.mobile_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mobile number already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    try:
        new_user = User(
            mobile_number=reg_user.mobile_number,
            email=reg_user.email,
            full_name=reg_user.full_name,
            role=reg_user.role,
            mfa_enabled=True,
        )
        new_user.set_password(reg_user.password)
        # if reg_user.enable_mfa:
        #     # print("YRAH ENABLING MFA")
        #     recovery_codes = new_user.enable_mfa()
        #     mfa_uri = new_user.get_mfa_uri()
        # else:
        #     # print("NO NO MFA")
        #     recovery_codes = None
        #     mfa_uri = None

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access, refresh = create_tokens(
            new_user.id, role=new_user.role, mfa_verified=False
        )
        return {
            "user": new_user.to_dict_safe(),
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration Failed {str(e)}",
        )


async def login_user(
    log_user: LoginRequest, db: Session, response: Response, request: Request
) -> UserDetailOut:
    is_valid_captcha = await verify_turnstile_token(
        log_user.captcha_token, request.client.host
    )
    if not is_valid_captcha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha verification failed",
        )
    user = db.scalar(
        select(User).where(
            or_(
                User.mobile_number == log_user.email_or_mobile_number,
                User.id == log_user.email_or_mobile_number,
            )
        )
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not exists.",
        )
    if not user.verify_password(log_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="User account disabled"
        )

    if user.mfa_enabled:
        # print("LOGGGING USER", log_user)
        if not log_user.mfa_code:
            raise HTTPException(status_code=400, detail="MFA code required")
        if not user.verify_mfa_code(log_user.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    mfa_verified = user.mfa_enabled
    access, refresh = create_tokens(
        user_id=user.id, role=user.role, mfa_verified=mfa_verified
    )
    set_csrf_cookie(response)
    set_jwt_cookies(response=response, access_token=access, refresh_token=refresh)

    return UserDetailOut.model_validate(user)


def refresh_access_token(
    refresh_token: Annotated[str, "refresh token"],
    db: Annotated[Session, "Getting db connectoion"],
    response: Annotated[Response, ""],
):
    payload = verify_refresh_token(token=refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or Expired Refresh Token",
        )
    user_id = payload.get("sub")
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    access, refresh = create_tokens(
        user_id=user.id, role=user.role, mfa_verified=user.mfa_enabled
    )

    set_jwt_cookies(response=response, access_token=access, refresh_token=refresh)
    set_csrf_cookie(response)

    return {
        "msg": "Token Refreshed successfully",
        "user": user.to_dict_safe(),
    }
