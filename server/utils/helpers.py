import uuid
from datetime import datetime, timezone
import re
import os
from pathlib import Path
from fastapi import HTTPException, status, UploadFile
from dotenv import load_dotenv

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_CANDIDATE_IMG_PATH = os.path.join(BASE_SERVER_DIR, "uploads", "candidates_picture")
BASE_PARENT_IMG_PATH = os.path.join(BASE_SERVER_DIR, "uploads", "parent_pictures")
BASE_UPLOAD_DIR = os.path.join(BASE_SERVER_DIR, "uploads")


BASE_STORE_CANDIDATE_UPLOADS = os.path.join(
    BASE_SERVER_DIR, "uploads", "store_uploads", "candidates"
)
os.makedirs(BASE_CANDIDATE_IMG_PATH, exist_ok=True)
os.makedirs(BASE_STORE_CANDIDATE_UPLOADS, exist_ok=True)
os.makedirs(BASE_PARENT_IMG_PATH, exist_ok=True)


def generate_readable_id(prefix: str) -> str:
    date_part = datetime.now().strftime("%Y%m%d")
    unique_part = uuid.uuid4().hex[:6].upper()
    return f"{prefix}-{date_part}-{unique_part}"


def normalize_path(path: str) -> str:
    """
    Normalize file path to absolute, clean, Linux-style format with forward slashes.
    """
    # 1️⃣ Convert to absolute path and resolve symlinks
    abs_path = Path(path).resolve()

    # 2️⃣ Convert to string and replace all backslashes with single forward slashes
    normalized = re.sub(r"[\\/]+", "/", str(abs_path))

    return normalized


async def save_image_file(
    store_id: str,
    photo: UploadFile,
    candidate_id: str | None = None,
    isVerify: bool = False,
    isParent: bool = False,
    isLaptopIssuance: bool = False,
):
    try:
        if isParent:
            upload_img_dir = os.path.join(BASE_PARENT_IMG_PATH)
        elif isLaptopIssuance:
            upload_img_dir = os.path.join(
                BASE_SERVER_DIR, "uploads", "laptop_issuance", store_id
            )
        else:
            upload_img_dir = (
                os.path.join(BASE_STORE_CANDIDATE_UPLOADS, store_id)
                if isVerify
                else os.path.join(BASE_CANDIDATE_IMG_PATH, store_id)
            )
        os.makedirs(upload_img_dir, exist_ok=True)

        valid_mime_types = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ]
        if photo.content_type not in valid_mime_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image format. Allowed formats: JPEG, PNG, GIF, WEBP.",
            )

        # Read file content
        contents = await photo.read()
        if not photo.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename.",
            )

        ext = photo.filename.split(".")[-1].lower()

        filename = f"{candidate_id}.{ext}" if candidate_id else photo.filename
        uploaded_img_path = os.path.join(upload_img_dir, filename)
        norm_uploaded_img_path = normalize_path(uploaded_img_path)

        with open(norm_uploaded_img_path, "wb") as f:
            f.write(contents)

        return norm_uploaded_img_path

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error saving the image", "err_stack": str(e)},
        )


def ensure_utc(dt: datetime) -> datetime:
    """Ensure a datetime is timezone-aware (UTC)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_relative_upload_path(full_path: str) -> str:
    full_path = full_path.replace("\\", "/")  # normalize slashes
    if "/uploads/" in full_path:
        # get substring starting from "/uploads/"
        return full_path.split("/uploads/", 1)[1]  # just after uploads/
    # fallback - remove base dir if it matches
    if full_path.startswith(BASE_UPLOAD_DIR.replace("\\", "/")):
        rel_path = full_path[len(BASE_UPLOAD_DIR) :].lstrip("/")
        return rel_path
    return full_path
