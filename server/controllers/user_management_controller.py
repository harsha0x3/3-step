from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func, asc, desc
from models.users import User
from models.password_reset_otps import PasswordResetOtp
from models.schemas.auth_schemas import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    PasswordResetRequestSchema,
    PasswordResetVerifySchema,
    PasswordChangeSchema,
    UserDetailOut,
    UsersSearchParams,
)
from models.schemas.otp_schemas import SmsOtpPayload
from services.verification_service.mobile_notification_service import send_login_sms_otp
from datetime import datetime, timezone
from utils.helpers import ensure_utc


DEFAULT_PASSWORD = "password@123"


def admin_create_user(
    payload: AdminCreateUserRequest, db: Session, admin_user_id: str | None = None
) -> dict[str, Any]:
    """Admin creates a new user with default password"""

    # Check if user already exists
    print(f"DEBUG PAYLOAD - {payload.model_dump()}")

    existing_user = db.scalar(
        select(User).where(or_(User.mobile_number == payload.mobile_number))
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="mobile number or email already exists",
        )

    # Validate store assignment for store agents
    if payload.role == "store_agent" and not payload.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="store_id is required for store_agent role",
        )

    try:
        new_user = User(
            mobile_number=payload.mobile_number,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            store_id=payload.store_id,
            is_first_login=True,
            must_change_password=True,
            mfa_enabled=False,
            location=payload.location,
        )
        new_user.set_password(DEFAULT_PASSWORD)

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Send welcome email with credentials
        # TODO: Implement send_welcome_email function

        return {
            "msg": "User created successfully",
            "data": {
                "user": UserDetailOut.model_validate(new_user),
                "default_password": DEFAULT_PASSWORD,
            },
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}",
        )


def admin_update_user(
    user_id: str, payload: AdminUpdateUserRequest, db: Session
) -> dict[str, Any]:
    """Admin updates user details"""

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    try:
        # Update fields that are provided
        if payload.mobile_number:
            # Check if mobile_number is taken by another user
            existing = db.scalar(
                select(User).where(
                    User.mobile_number == payload.mobile_number, User.id != user_id
                )
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mobile_number already taken",
                )
            user.mobile_number = payload.mobile_number

        if payload.email:
            # Check if email is taken by another user
            existing = db.scalar(
                select(User).where(User.email == payload.email, User.id != user_id)
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already taken",
                )
            user.email = payload.email

        if payload.full_name:
            user.full_name = payload.full_name

        if payload.role:
            user.role = payload.role
            # If changing to store_agent, require store_id
            if (
                payload.role == "store_agent"
                and not payload.store_id
                and not user.store_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="store_id is required for store_agent role",
                )

        if payload.store_id is not None:
            user.store_id = payload.store_id

        if payload.is_active is not None:
            user.is_active = payload.is_active

        if payload.location is not None:
            user.location = payload.location

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "msg": "User updated successfully",
            "data": {"user": UserDetailOut.model_validate(user)},
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}",
        )


def admin_delete_user(user_id: str, db: Session) -> dict[str, Any]:
    """Admin deletes (deactivates) a user"""

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    try:
        # Soft delete by deactivating
        user.is_active = False
        db.add(user)
        db.commit()

        return {"msg": "User deactivated successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}",
        )


def admin_get_all_users(db: Session, params: UsersSearchParams):
    try:
        stmt = select(User)

        # ---- Count Query ----
        count_stmt = select(func.count(User.id))
        total_count = db.scalar(count_stmt)

        # ---- Filters ----
        if params.role and params.role != "null":
            stmt = stmt.where(User.role == params.role)

        if params.disabled is not None:
            stmt = stmt.where(User.disabled == params.disabled)

        # ---- Search ----
        if params.search_by and params.search_term and params.search_term != "null":
            setattr(params, "page", -1)
            column_attr = getattr(User, params.search_by)
            stmt = stmt.where(column_attr.ilike(f"%{params.search_term}%"))

        # ---- Sorting ----
        sort_col = getattr(User, params.sort_by)
        sort_col = asc(sort_col) if params.sort_order == "asc" else desc(sort_col)

        # ---- Pagination ----
        # if params.page >= 1:
        #     users = db.scalars(
        #         stmt.order_by(sort_col)
        #         .limit(params.page_size)
        #         .offset((params.page - 1) * params.page_size)
        #     ).all()
        # else:
        users = db.scalars(stmt.order_by(sort_col)).all()

        result = [UserDetailOut.model_validate(u) for u in users]

        return {
            "msg": "Users retrieved successfully",
            "data": {
                "users": result,
                "total_count": total_count,
                "count": len(result),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Failed to fetch users", "err_stack": str(e)},
        )


def admin_get_user_by_id(user_id: str, db: Session) -> UserDetailOut:
    """Admin gets specific user details"""

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserDetailOut.model_validate(user)


async def request_password_reset(payload: PasswordResetRequestSchema, db: Session):
    """User requests password reset - sends OTP to email"""

    user = (
        db.scalar(select(User).where(User.email == payload.email))
        if payload.email
        else db.scalar(select(User).where(User.mobile_number == payload.mobile_number))
    )
    if not user:
        # Don't reveal if email exists or not
        return {"msg": "If the email or exists, a reset code has been sent"}

    try:
        # Delete any existing OTP for this user
        existing_otp = db.scalar(
            select(PasswordResetOtp).where(PasswordResetOtp.user_id == user.id)
        )
        if existing_otp:
            db.delete(existing_otp)
            db.commit()

        # Generate new OTP
        new_otp = PasswordResetOtp(user_id=user.id)
        otp_value = new_otp.generate_otp()

        db.add(new_otp)
        db.commit()

        # Send OTP via email
        sms_payload = SmsOtpPayload(otp=otp_value, mobile_number=user.mobile_number)
        await send_login_sms_otp(payload=sms_payload)

        return {"msg": "Password reset code sent to your email"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send reset code: {str(e)}",
        )


async def verify_password_reset(payload: PasswordResetVerifySchema, db: Session):
    """User verifies OTP and sets new password"""

    user = (
        db.scalar(select(User).where(User.email == payload.email))
        if payload.email
        else db.scalar(select(User).where(User.mobile_number == payload.mobile_number))
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get OTP record
    otp_record = db.scalar(
        select(PasswordResetOtp).where(PasswordResetOtp.user_id == user.id)
    )
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No password reset request found. Please request a new code.",
        )

    # Check if OTP is expired
    if ensure_utc(otp_record.expires_at) < datetime.now(timezone.utc):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one.",
        )

    # Verify OTP
    if not otp_record.verify_otp(payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code",
        )

    try:
        # Update password
        user.set_password(payload.new_password)
        user.must_change_password = False
        user.is_first_login = False

        # Delete used OTP
        db.delete(otp_record)

        db.add(user)
        db.commit()

        return {"msg": "Password reset successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}",
        )


def change_password(
    user_id: str, payload: PasswordChangeSchema, db: Session
) -> dict[str, Any]:
    """User changes their own password"""

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify current password
    if not user.verify_password(payload.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    try:
        # Set new password
        user.set_password(payload.new_password)
        user.must_change_password = False
        user.is_first_login = False

        db.add(user)
        db.commit()

        return {"msg": "Password changed successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}",
        )


def admin_reset_user_password(user_id: str, db: Session) -> dict[str, Any]:
    """Admin resets user password to default"""

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    try:
        user.set_password(DEFAULT_PASSWORD)
        user.must_change_password = True
        user.is_first_login = True

        db.add(user)
        db.commit()

        return {
            "msg": "Password reset to default",
            "data": {"default_password": DEFAULT_PASSWORD},
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}",
        )
