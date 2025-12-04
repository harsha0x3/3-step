from fastapi import Depends, HTTPException, status, Cookie, Response
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from models.users import User
from .jwt_handler import (
    decode_access_token,
    verify_refresh_token,
    create_tokens,
    set_jwt_cookies,
)
from models.schemas.auth_schemas import UserOut


# def get_current_user(
#     access_token: str | None = Cookie(default=None),
#     refresh_token: str | None = Cookie(default=None),
#     db: Session = Depends(get_db_conn),
# ) -> UserOut:
#     try:
#         if access_token:
#             payload = decode_access_token(access_token)
#         else:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED, detail="No access token"
#             )
#     except Exception as e:
#         print(f"ERROR IN current User {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Token"
#         )
#     user = db.get(User, payload.get("sub"))

#     if not user or not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user"
#         )
#     user_data = UserOut.model_validate(user.to_dict_safe())

#     return user_data


def get_current_user(
    response: Response,
    lt_access_token: str | None = Cookie(default=None),
    lt_refresh_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db_conn),
):
    payload = None

    # Try decoding access token first
    if lt_access_token:
        try:
            payload = decode_access_token(lt_access_token)
        except Exception as e:
            pass
            # print(f"Invalid access token: {e}")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token not found",
        )

    # If no valid access token, try refresh
    if not payload and lt_refresh_token:
        try:
            payload = verify_refresh_token(lt_refresh_token)
            user = db.get(User, payload.get("sub"))

            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Inactive user",
                )

            # Create new tokens
            access, refresh = create_tokens(
                user_id=user.id, role=user.role, mfa_verified=user.mfa_enabled
            )
            set_jwt_cookies(response, access, refresh)

            # print("Access token refreshed successfully")

        except Exception as e:
            # print(f"Refresh token invalid: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid access and refresh token. Login again.",
            )

    elif not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    # Fetch the user (works for both valid or refreshed tokens)
    user = db.get(User, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive or non-existent user",
        )

    return UserOut.model_validate(user)
