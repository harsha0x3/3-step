import secrets
from fastapi import Response
import os
from dotenv import load_dotenv

load_dotenv()

is_prod = os.getenv("PROD_ENV", "false").lower() == "true"


def generate_csrf_token() -> str:
    """Generate a secure CSRF token."""
    return secrets.token_urlsafe(32)


def set_csrf_cookie(response: Response):
    """Set the CSRF token in a cookie."""
    csrf_token = generate_csrf_token()
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # Allow JavaScript access
        secure=True,  # Changed: secure in prod, not secure in dev
        samesite="lax" if is_prod else "none",
        path="/",
    )
    return csrf_token


def clear_csrf_cookie(response: Response):
    """Clear the CSRF token cookie."""
    response.delete_cookie(
        key="csrf_token",
        httponly=False,
        secure=not is_prod,  # Changed: must match set_cookie
        samesite="lax" if is_prod else "none",
        path="/",
    )
