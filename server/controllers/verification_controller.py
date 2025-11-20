from services.verification_service.email_service import send_otp_email
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.candidates import Candidate
from models.verification_statuses import VerificationStatus
from models.otps import Otp
from datetime import datetime, timezone
from models.schemas.otp_schemas import CandidateInOtp
from models.issued_statuses import IssuedStatus
from deepface import DeepFace
import os
from utils.helpers import (
    normalize_path,
    ensure_utc,
    get_relative_upload_path,
    save_image_file,
)
from dotenv import load_dotenv

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_CANDIDATE_IMG_PATH = os.path.join(BASE_SERVER_DIR, "uploads", "candidates_picture")
BASE_STORE_CANDIDATE_UPLOADS = os.path.join(
    BASE_SERVER_DIR, "uploads", "store_uploads", "candidates"
)
os.makedirs(BASE_CANDIDATE_IMG_PATH, exist_ok=True)
os.makedirs(BASE_STORE_CANDIDATE_UPLOADS, exist_ok=True)


async def generate_otp(candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )
        existing_otp = db.scalar(select(Otp).where(Otp.candidate_id == candidate.id))
        now = datetime.now(timezone.utc)
        exp = ensure_utc(existing_otp.expires_at) if existing_otp else None

        if existing_otp and exp and exp < now:
            remaining = int((exp - now).total_seconds())
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An unexpired OTP already exists. Try again after {remaining} seconds.",
            )

        new_otp = Otp(candidate_id=candidate.id)
        otp_val = new_otp.generate_otp()

        db.add(new_otp)
        db.commit()
        db.refresh(new_otp)

        email_payload = CandidateInOtp(
            otp=otp_val,
            candidate_name=candidate.full_name,
            candidate_email="cgharshavardhan05@gmail.com",
            expiry_minutes="20",
            store_name=candidate.store.name,
            store_address_line=candidate.store.address,
            store_city=candidate.store.city,
            support_email="support_temp@gmail.com",
            support_phone="1234567890",
        )

        email_res = await send_otp_email(email_payload=email_payload)
        if email_res and email_res.get("success"):
            return {"msg": "OTP has been sent to candidates registered E-Mail"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating OTP: {str(e)}",
        )


async def otp_resend(candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )
        otp = db.scalar(select(Otp).where(Otp.candidate_id == candidate.id))
        now = datetime.now(timezone.utc)

        if otp and ensure_utc(otp.expires_at) < now:
            db.delete(otp)
            db.commit()

            otp = Otp(candidate_id=candidate.id)
            otp_val = otp.generate_otp()

            db.add(otp)
            db.commit()
            db.refresh(otp)
        elif otp is None:
            otp = Otp(candidate_id=candidate.id)
            _otp_val = otp.generate_otp()

            db.add(otp)
            db.commit()
            db.refresh(otp)

        email_payload = CandidateInOtp(
            otp=otp.otp,
            candidate_name=candidate.full_name,
            candidate_email="cgharshavardhan05@gmail.com",
            expiry_minutes="20",
            store_name=candidate.store.name,
            store_address_line=candidate.store.address,
            store_city=candidate.store.city,
            support_email="support_temp@gmail.com",
            support_phone="1234567890",
        )
        email_res = await send_otp_email(email_payload=email_payload)
        if email_res and email_res.get("success"):
            return {"msg": "OTP has been sent to candidates registered E-Mail"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resending OTP: {str(e)}",
        )


async def facial_recognition(img_path: str, store_id: str):
    try:
        norm_input_img_path = normalize_path(os.path.join("uploads", img_path))
        print(f"RECIEVED IMG PATH - {img_path}")
        print(f"NORM IMG PATH - {norm_input_img_path}")
        cand_imgs_path = os.path.join(BASE_CANDIDATE_IMG_PATH, store_id)
        norm_cand_imgs_path = normalize_path(cand_imgs_path)
        print(f"DB-PATH - {norm_cand_imgs_path}")
        found_candidate = DeepFace.find(
            img_path=norm_input_img_path, db_path=norm_cand_imgs_path
        )
        print(f"complete -found - {found_candidate[0]}")
        print(f"fount []0 - {found_candidate[0]}")

        if found_candidate[0].empty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate image not found",
            )

        norm_found_cand_img_path = normalize_path(found_candidate[0]["identity"][0])
        print(f"found cand PATH - {normalize_path(found_candidate[0]['identity'][0])}")
        return get_relative_upload_path(norm_found_cand_img_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error Verifying candidate", "err_stack": str(e)},
        )


async def verify_otp(candidate_id: str, otp_input: str, db: Session):
    try:
        otp_record = db.scalar(select(Otp).where(Otp.candidate_id == candidate_id))
        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="OTP not found. Please request for the OTP before verifying.",
            )

        exp = ensure_utc(otp_record.expires_at)
        now = datetime.now(timezone.utc)

        if exp < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired"
            )
        if otp_record.otp != otp_input:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP"
            )

        db.delete(otp_record)
        verification_status = db.get(VerificationStatus, candidate_id)
        if not verification_status or not verification_status.is_facial_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate has not been facially verified yet",
            )

        verification_status.is_otp_verified = True
        db.add(verification_status)
        db.commit()
        db.refresh(verification_status)

        return {"msg": "OTP verified successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying OTP: {str(e)}",
        )


async def upload_laptop_issuance_evidence(
    candidate_id: str,
    db: Session,
    photo: UploadFile,
    user_id: str,
    store_id: str,
):
    try:
        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_id)
        )

        photo_url = await save_image_file(
            store_id=store_id,
            photo=photo,
            candidate_id=candidate_id,
            isLaptopIssuance=True,
        )

        if not issued_status:
            issued_status = IssuedStatus(
                candidate_id=candidate_id,
                issued_status="not_issued",
                evidence_photo=photo_url,
                issued_at=datetime.now(timezone.utc),
                issued_by=user_id,
            )
        else:
            issued_status.evidence_photo = photo_url

        db.add(issued_status)
        db.commit()
        db.refresh(issued_status)
        return {"msg": "Evidence photo uploaded successfully.", "data": issued_status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding evidence photo. Try again.",
        )


async def upload_laptop_issuance_bill_reciept(
    candidate_id: str,
    db: Session,
    photo: UploadFile,
    user_id: str,
    store_id: str,
):
    try:
        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_id)
        )

        photo_url = await save_image_file(
            store_id=store_id,
            photo=photo,
            candidate_id=candidate_id,
            isLaptopIssuance=True,
        )

        if not issued_status:
            issued_status = IssuedStatus(
                candidate_id=candidate_id,
                issued_status="not_issued",
                bill_reciept=photo_url,
                issued_at=datetime.now(timezone.utc),
                issued_by=user_id,
            )
        else:
            issued_status.bill_reciept = photo_url

        db.add(issued_status)
        db.commit()
        db.refresh(issued_status)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding reciept photo. Try again.",
        )


async def upload_laptop_issuance(
    candidate_id: str, db: Session, laptop_serial: str, user_id: str
):
    try:
        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_id)
        )
        if issued_status and issued_status.issued_status == "issued":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Already recieved the product.",
            )
        if not issued_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="None of the evidence photos are uploaded. please upload the evidence photo and reciept",
            )

        if not issued_status.evidence_photo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Evidence photo of laptop issuance is not uploaded. Please upload and try again.",
            )
        if not issued_status.bill_reciept:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bill Reciept photo of laptop issuance is not uploaded. Please upload and try again.",
            )

        issued_status.issued_status = "issued"

        issued_status.issued_at = datetime.now(timezone.utc)
        issued_status.issued_laptop_serial = laptop_serial
        issued_status.issued_by = user_id
        db.add(issued_status)
        db.commit()
        db.refresh(issued_status)
        return issued_status
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating issued status: {str(e)}",
        )


def get_issuance_details(candidate_id: str, db: Session):
    try:
        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_id)
        )

        if not issued_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issuance details doesn't exist. The verification process of the beneficiary is started yet.",
            )

        return issued_status.__dict__

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching issuance details.",
        )


# async def add_coupon_code_to_candidate(
#     candidate_id: str, coupon_code: str, db: Session
# ):
#     try:
#         coupon = db.scalar(select(Coupon).where(Coupon.candidate_id == candidate_id))
#         if coupon:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Coupon already exists for the candidate.",
#             )
#         new_coupon = Coupon(
#             candidate_id=candidate_id, coupon_code=coupon_code, is_used=False
#         )
#         db.add(new_coupon)
#         db.commit()
#         db.refresh(new_coupon)
#         return new_coupon
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error adding coupon code: {str(e)}",
#         )


# async def verify_coupon_code(candidate_id: str, coupon_code: str, db: Session):
#     try:
#         verification_status = db.scalar(
#             select(VerificationStatus).where(
#                 VerificationStatus.candidate_id == candidate_id
#             )
#         )
#         if not verification_status:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Verification status not found for the candidate",
#             )
#         elif not verification_status.is_facial_verified:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Candidate has not been facially verified yet",
#             )
#         elif not verification_status.is_otp_verified:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Candidate has not been OTP verified yet",
#             )

#         coupon = db.scalar(select(Coupon).where(Coupon.candidate_id == candidate_id))
#         if not coupon:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Coupon not found for the candidate. Contact support.",
#             )
#         if coupon.coupon_code != coupon_code:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Invalid coupon code.",
#             )
#         if coupon.is_used:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Coupon code has already been used.",
#             )
#         coupon.is_used = True
#         verification_status.is_coupon_verified = True
#         db.add(coupon)
#         db.add(verification_status)
#         db.commit()
#         db.refresh(coupon)
#         db.refresh(verification_status)
#         return {"msg": "Coupon code verified successfully."}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error verifying coupon code: {str(e)}",
#         )
