from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, Literal

from db.connection import get_db_conn
from models.schemas.auth_schemas import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    PasswordResetRequestSchema,
    PasswordResetVerifySchema,
    PasswordChangeSchema,
    UserOut,
    UsersSearchParams,
)
from services.auth.deps import get_current_user
from controllers.user_management_controller import (
    admin_update_user,
    admin_delete_user,
    admin_get_all_users,
    admin_get_user_by_id,
    request_password_reset,
    verify_password_reset,
    change_password,
    admin_reset_user_password,
    admin_create_user,
)

router = APIRouter(prefix="/users", tags=["User Management"])


def require_admin(current_user: UserOut = Depends(get_current_user)):
    """Dependency to check if user is admin or super_admin"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


# ============================================
# ADMIN ENDPOINTS
# ============================================


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: AdminCreateUserRequest,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return admin_create_user(payload=payload, db=db, admin_user_id=current_user.id)
    """Admin creates a new user with default password"""


@router.get("", status_code=status.HTTP_200_OK)
async def get_all_users(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
    # ---- Search ----
    search_by: Annotated[
        Literal["id", "mobile_number", "full_name", "role"] | None,
        Query(title="Search users by"),
    ] = "full_name",
    search_term: Annotated[str | None, Query(title="Search term")] = None,
    # ---- Sorting ----
    sort_by: Annotated[
        Literal["created_at", "updated_at", "full_name", "email"],
        Query(title="Sort users by"),
    ] = "created_at",
    sort_order: Annotated[
        Literal["asc", "desc"], Query(title="Order of sorting")
    ] = "desc",
    # ---- Filters ----
    role: Annotated[str | None, Query(title="Filter by role")] = None,
    disabled: Annotated[bool | None, Query(title="Filter by disabled status")] = None,
    region_id: Annotated[str | None, Query(title="Filter by region ID")] = None,
    # ---- Pagination ----
    page: Annotated[int, Query(title="Page number")] = 1,
    page_size: Annotated[int, Query(title="Items per page")] = 15,
):
    params = UsersSearchParams(
        search_by=search_by,
        search_term=search_term,
        sort_by=sort_by,
        sort_order=sort_order,
        role=role,
        disabled=disabled,
        region_id=region_id,
        page=page,
        page_size=page_size,
    )

    return admin_get_all_users(db, params)


@router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_user(
    user_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
):
    """Admin gets specific user details"""
    user = admin_get_user_by_id(user_id, db)
    return {"msg": "User retrieved successfully", "data": {"user": user}}


@router.patch("/{user_id}", status_code=status.HTTP_200_OK)
async def update_user(
    user_id: str,
    payload: AdminUpdateUserRequest,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
):
    """Admin updates user details"""
    return admin_update_user(user_id, payload, db, current_user)


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
):
    """Admin deactivates a user"""
    return admin_delete_user(user_id, db)


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    user_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(require_admin)],
):
    """Admin resets user password to default"""
    return admin_reset_user_password(user_id, db)


# ============================================
# USER SELF-SERVICE ENDPOINTS
# ============================================


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
async def request_reset(
    payload: PasswordResetRequestSchema,
    db: Annotated[Session, Depends(get_db_conn)],
):
    """Request password reset - sends OTP to email"""
    return await request_password_reset(payload, db)


@router.post("/password-reset/verify", status_code=status.HTTP_200_OK)
async def verify_reset(
    payload: PasswordResetVerifySchema,
    db: Annotated[Session, Depends(get_db_conn)],
):
    """Verify OTP and set new password"""
    return await verify_password_reset(payload, db)


@router.post("/password/change", status_code=status.HTTP_200_OK)
async def change_user_password(
    payload: PasswordChangeSchema,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """User changes their own password"""
    return change_password(current_user.id, payload, db)
