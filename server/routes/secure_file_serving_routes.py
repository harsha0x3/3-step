from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
import os

from services.auth.deps import get_current_user  # authentication

router = APIRouter(prefix="/secured_file", tags=["secured files"])

BASE_DIR = Path(os.getenv("BASE_SERVER_DIR", ""))
UPLOADS_DIR = (BASE_DIR / "uploads").resolve()


@router.get("")
def serve_secure_file(
    path: str = Query(..., description="Relative file path saved in DB"),
    current_user=Depends(get_current_user),  # secure
):
    # Prevent directory traversal attacks:
    safe_path = (BASE_DIR / path).resolve()
    if BASE_DIR not in safe_path.parents:
        raise HTTPException(400, "Invalid file path")

    if UPLOADS_DIR not in safe_path.parents:
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not safe_path.exists():
        print("safe_path", safe_path)
        raise HTTPException(404, "File not found")

    return FileResponse(
        safe_path,
        headers={
            "Cache-Control": "private, max-age=3600"  # optional caching
        },
    )
