from jose import JWTError, jwt
from datetime import datetime, timezone, timedelta
from typing import Any
import os
from fastapi import Response, HTTPException, status


class JWTConfig:
    SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
    REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", "your-refresh-secret")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "15")
    )
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "15"))


def create_tokens(user_id: str, role: str, mfa_verified: bool) -> tuple[str, str]:
    now = datetime.now(timezone.utc)
    access_payload = {
        "sub": user_id,
        "role": role,
        "mfa_verified": mfa_verified,
        "iat": now,
        "exp": now + timedelta(minutes=JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    refresh_payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS),
    }

    access_token = jwt.encode(
        access_payload, JWTConfig.SECRET_KEY, algorithm=JWTConfig.ALGORITHM
    )
    refresh_token = jwt.encode(
        refresh_payload, JWTConfig.REFRESH_SECRET_KEY, algorithm=JWTConfig.ALGORITHM
    )

    return access_token, refresh_token


def create_challenge_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "mfa_challenge",
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, JWTConfig.SECRET_KEY, algorithm=JWTConfig.ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, JWTConfig.SECRET_KEY, algorithms=JWTConfig.ALGORITHM)


def verify_refresh_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token, JWTConfig.REFRESH_SECRET_KEY, algorithms=JWTConfig.ALGORITHM
        )
    except JWTError as je:
        print(f"Encountered JWTERROR: {str(je)}")
        raise
    except Exception as e:
        print(f"Encountered error in refresh verify: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Expired or invalid refresh token",
        )

    if payload:
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
            )

        return payload
    return None


def set_jwt_cookies(response: Response, access_token: str, refresh_token: str):
    try:
        access_exp = datetime.now(timezone.utc) + timedelta(
            minutes=JWTConfig.ACCESS_TOKEN_EXPIRE_MINUTES
        )
        refresh_exp = datetime.now(timezone.utc) + timedelta(
            days=JWTConfig.REFRESH_TOKEN_EXPIRE_DAYS
        )

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="strict",
            path="/",
            expires=int(access_exp.timestamp()),
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="strict",
            path="/",
            expires=int(refresh_exp.timestamp()),
        )
    except Exception as e:
        print(f"Encountered Error in Setting cookies {str(e)}")
        raise
