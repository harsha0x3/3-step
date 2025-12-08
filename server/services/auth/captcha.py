import httpx
import os
from dotenv import load_dotenv

load_dotenv()
TURNSTILE_SECRET = os.getenv("TURNSTILE_SECRET")


async def verify_turnstile_token(token: str, remote_ip: str | None = None) -> bool:
    """
    Verifies the Turnstile token with Cloudflare.
    """
    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    data = {
        "secret": TURNSTILE_SECRET,
        "response": token,
    }
    if remote_ip:
        data["remoteip"] = remote_ip

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data, timeout=5)
        resp.raise_for_status()
        result = resp.json()
        return result.get("success", False)
