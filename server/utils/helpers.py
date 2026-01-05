import uuid
from datetime import datetime, timezone
import re
import os
from pathlib import Path
from fastapi import HTTPException, status, UploadFile
from dotenv import load_dotenv
import random
import shutil
from time import time

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_CANDIDATE_IMG_PATH = os.path.join(BASE_SERVER_DIR, "uploads", "candidates_picture")
BASE_UPLOAD_DIR = os.path.join(BASE_SERVER_DIR, "uploads")


BASE_STORE_CANDIDATE_UPLOADS = os.path.join(
    BASE_SERVER_DIR, "uploads", "store_uploads", "candidates"
)
os.makedirs(BASE_CANDIDATE_IMG_PATH, exist_ok=True)
os.makedirs(BASE_STORE_CANDIDATE_UPLOADS, exist_ok=True)


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


def norm_to_uploads_dir(path: str):
    if "uploads" not in path:
        dir_path = os.path.join("uploads", path)
        return normalize_path(dir_path)


async def save_image_file(
    store_id: str,
    photo: UploadFile,
    candidate_id: str | None = None,
    isVerify: bool = False,
    isLaptopIssuance: bool = False,
    prefix: str | None = None,
):
    store_name = store_id if store_id else "no_store"
    try:
        if isLaptopIssuance:
            upload_img_dir = os.path.join(
                BASE_SERVER_DIR, "uploads", "laptop_issuance", store_name
            )
        else:
            upload_img_dir = (
                os.path.join(BASE_STORE_CANDIDATE_UPLOADS, store_name)
                if isVerify
                else os.path.join(BASE_CANDIDATE_IMG_PATH, store_name)
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

        filename = (
            f"{candidate_id}_{int(time())}.{ext}" if candidate_id else photo.filename
        )
        filename = f"{prefix}_{int(time())}_{filename}" if prefix else filename
        uploaded_img_path = os.path.join(upload_img_dir, filename)
        norm_uploaded_img_path = normalize_path(uploaded_img_path)

        with open(norm_uploaded_img_path, "wb") as f:
            f.write(contents)

        print(
            f"RELATIVE PATH OF VERIFY PIC - {get_relative_upload_path(norm_uploaded_img_path)}"
        )

        return get_relative_upload_path(norm_uploaded_img_path)

    except HTTPException:
        raise
    except Exception as e:
        print("SAVE IMG ERR")
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error saving the image", "err_stack": str(e)},
        )


async def save_vendor_spoc_img(photo: UploadFile):
    try:
        upload_img_dir = os.path.join(BASE_UPLOAD_DIR, "vendors")
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

        filename = photo.filename
        uploaded_img_path = os.path.join(upload_img_dir, filename)
        norm_uploaded_img_path = normalize_path(uploaded_img_path)

        with open(norm_uploaded_img_path, "wb") as f:
            f.write(contents)

        return get_relative_upload_path(norm_uploaded_img_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error saving the image", "err_stack": str(e)},
        )


async def save_aadhar_photo(photo: UploadFile, candidate_id: str):
    try:
        upload_img_dir = os.path.join(BASE_UPLOAD_DIR, "aadhar")
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

        filename = f"{candidate_id}_aadhar_{int(time())}.{ext}"

        uploaded_img_path = os.path.join(upload_img_dir, filename)
        norm_uploaded_img_path = normalize_path(uploaded_img_path)

        with open(norm_uploaded_img_path, "wb") as f:
            f.write(contents)

        return get_relative_upload_path(norm_uploaded_img_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error saving the image", "err_stack": str(e)},
        )


async def save_offline_uploaded_file(file: UploadFile, store_name: str) -> str:
    """
    Save uploaded CSV/Excel file to disk and return the saved file path.
    """

    if not file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded file not found."
        )
    # Ensure folder exists
    upload_path = os.path.join(BASE_UPLOAD_DIR, "offline_records")
    os.makedirs(upload_path, exist_ok=True)

    # Generate safe unique filename
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = file.filename.split(".")[-1].lower()

    filename = f"{store_name}_{timestamp}{suffix}"
    uploaded_img_path = os.path.join(upload_path, filename)
    norm_uploaded_img_path = normalize_path(uploaded_img_path)

    # Save file to disk
    with open(norm_uploaded_img_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return get_relative_upload_path(norm_uploaded_img_path)


async def save_utility_pdf(file: UploadFile, file_name: str) -> str:
    """
    Save uploaded PDF file into uploads/utilities/ and return its relative path.
    """

    try:
        # Validate file existence
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded."
            )

        # Validate MIME type (PDF only)
        valid_mime = ["application/pdf", "application/x-pdf"]
        if file.content_type not in valid_mime:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file format. Only PDF files are allowed.",
            )

        # Ensure directories exist
        utilities_dir = os.path.join(BASE_UPLOAD_DIR, "utilities")
        os.makedirs(utilities_dir, exist_ok=True)

        # Generate unique filename
        ext = file.filename.split(".")[-1].lower()

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        filename = f"utility_{file_name}_{timestamp}.{ext}"

        # Full path
        saved_path = os.path.join(utilities_dir, filename)
        norm_path = normalize_path(saved_path)

        # Save file
        with open(norm_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return relative path (your existing function)
        return get_relative_upload_path(norm_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error saving utility PDF", "err_stack": str(e)},
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
    if "/server/uploads/" in full_path:
        # get substring starting from "/uploads/"
        return full_path.split("/server/", 1)[1]  # just after uploads/
    # fallback - remove base dir if it matches
    if full_path.startswith(BASE_UPLOAD_DIR.replace("\\", "/")):
        rel_path = full_path[len(BASE_UPLOAD_DIR) :].lstrip("/")
        return rel_path
    return full_path


def generate_coupon() -> str:
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    return "".join(random.choices(chars, k=8))
