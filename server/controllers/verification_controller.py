from services.verification_service.email_service import (
    send_otp_email,
    send_otp_to_admin,
)
from services.verification_service.mobile_notification_service import (
    send_beneficiary_sms_otp,
)
from sqlalchemy.exc import IntegrityError

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, or_, exists
from models.candidates import Candidate
from models.otps import Otp
from datetime import datetime, timezone
from models.schemas.otp_schemas import CandidateInOtp, AdminOTPPayload, SmsOtpPayload
from models.schemas import verification_schemas as v_schemas
from models.schemas.candidate_schemas import CandidateItemWithStore
from models.schemas.store_schemas import StoreItemOut
from models.schemas.auth_schemas import UserOut
from models import IssuedStatus, VerificationStatus, UpgradeRequest, User
from deepface import DeepFace
import os
from utils.helpers import (
    normalize_path,
    ensure_utc,
    save_image_file,
)
from dotenv import load_dotenv
from datetime import date

from concurrent.futures import ThreadPoolExecutor
from threading import Lock

import asyncio

from utils.log_config import logger

max_workers = min(2, os.cpu_count() - 1)
executor = ThreadPoolExecutor(max_workers=max_workers)

load_dotenv()

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR", "")
BASE_CANDIDATE_IMG_PATH = os.path.join(BASE_SERVER_DIR, "uploads", "candidates_picture")
BASE_STORE_CANDIDATE_UPLOADS = os.path.join(
    BASE_SERVER_DIR, "uploads", "store_uploads", "candidates"
)
os.makedirs(BASE_CANDIDATE_IMG_PATH, exist_ok=True)
os.makedirs(BASE_STORE_CANDIDATE_UPLOADS, exist_ok=True)


_model = None
_model_lock = Lock()


def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                _model = DeepFace.build_model("VGG-Face")
    return _model


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
        logger.error(f"Error generating and sending OTP - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating OTP: {str(e)}",
        )


async def otp_resend(candidate_id: str, db: Session, to_admin: bool = False):
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
            _otp_val = otp.generate_otp()

            db.add(otp)
            db.commit()
            db.refresh(otp)
        elif otp is None:
            otp = Otp(candidate_id=candidate.id)
            _otp_val = otp.generate_otp()

            db.add(otp)
            db.commit()
            db.refresh(otp)

        if not to_admin:
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
            # email_res = await send_otp_email(email_payload=email_payload)
            sms_payload = SmsOtpPayload(
                otp=otp.otp, mobile_number=candidate.mobile_number
            )
            sms_res = await send_beneficiary_sms_otp(payload=sms_payload)
            if sms_res and sms_res.get("status") in [200, 202]:
                return {
                    "msg": "OTP has been sent to candidates registered Mobile Number",
                    "data": {
                        "expires_at": otp.expires_at,
                        "admin_phone": "9988998899",
                        "admin_mail": "admin@gmail.com",
                    },
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send OTP email.",
                )
        else:
            email_payload = AdminOTPPayload(
                otp=otp.otp,
                expiry_minutes="20",
                beneficiary_id=candidate.id,
                beneficiary_name=candidate.full_name,
                beneficiary_phone=candidate.mobile_number,
                store_name=candidate.store.name,
                store_address=candidate.store.address,
                support_email="support_temp@gmail.com",
                support_phone="1234567890",
            )
            email_res = await send_otp_to_admin(email_payload=email_payload)
            if email_res and email_res.get("success"):
                return {
                    "msg": "OTP has been sent to candidates registered Mobile Number",
                    "data": {
                        "expires_at": otp.expires_at,
                        "admin_phone": "9988998899",
                        "admin_mail": "admin@gmail.com",
                    },
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send OTP email to admin.",
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating and sending OTP - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resending OTP: {str(e)}",
        )


def check_spoof(image_path):
    try:
        face_objs = DeepFace.extract_faces(img_path=image_path, anti_spoofing=True)
        print("FACEOBJS", face_objs)
        # for f in face_objs:
        #     if not f["is_real"]:
        #         print(f"Possible spoof detected with score {f['antispoof_score']}")
        #         # You can return False or raise HTTPException if you want strict checking
        return not (all(f["is_real"] for f in face_objs))
    except Exception as e:
        return False


async def facial_recognition_old(img_path: str, original_img: str):
    try:
        norm_input_img_path = normalize_path(img_path)
        norm_org_cand_path = normalize_path(original_img)

        print(f"RECIEVED IMG PATH - {img_path}")
        print(f"NORM IMG PATH - {norm_input_img_path}")
        print(f"RECIEVED IMG PATH - {original_img}")
        print(f"NORM IMG PATH - {norm_org_cand_path}")
        # cand_imgs_path = os.path.join(BASE_CANDIDATE_IMG_PATH, store_id)
        # fallback_cand_imgs_path = os.path.join(BASE_CANDIDATE_IMG_PATH, "no_store")
        # norm_cand_imgs_path = normalize_path(cand_imgs_path)
        # fallback_norm_cand_imgs_path = normalize_path(fallback_cand_imgs_path)
        # print(f"DB-PATH - {norm_cand_imgs_path}")
        result = DeepFace.verify(
            img1_path=norm_input_img_path,
            img2_path=norm_org_cand_path,
        )
        print("THE RES")
        print(result)
        return result["verified"]

        # print(f"complete -found - {found_candidate[0]}")
        # print(f"fount []0 - {found_candidate[0]}")

        # if found_candidate[0].empty:
        #     found_candidate = DeepFace.find(
        #         img_path=norm_input_img_path, db_path=fallback_norm_cand_imgs_path
        #     )
        # if found_candidate[0].empty:
        #     raise HTTPException(
        #         status_code=status.HTTP_404_NOT_FOUND,
        #         detail="Candidate image not found",
        #     )

        # norm_found_cand_img_path = normalize_path(found_candidate[0]["identity"][0])
        # print(f"found cand PATH - {normalize_path(found_candidate[0]['identity'][0])}")
        # print(
        #     f"Found Relative Path - {get_relative_upload_path(norm_found_cand_img_path)}"
        # )
        # return get_relative_upload_path(norm_found_cand_img_path)

    except ValueError as e:
        print("Value error in facial verificaion", e)
        err = str(e).lower()
        return False
    except Exception as e:
        print("Facial verification err", e)
        raise HTTPException(
            status_code=500, detail=f"Face verification failed: {str(e)}"
        )


# model = DeepFace.build_model("VGG-Face")


def deepface_verify_sync(img1, img2):
    try:
        model = get_model()
        return DeepFace.verify(img1_path=img1, img2_path=img2, model_name="VGG-Face")
    except Exception as e:
        logger.error(f"Error in deepface verify - {e}")
        return {"verified": False}


face_semaphore = asyncio.Semaphore(2)


async def facial_recognition(img_path, original_img):
    try:
        print("CPU count", os.cpu_count())
        async with face_semaphore:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                executor, deepface_verify_sync, img_path, original_img
            )
            return result["verified"]
    except ValueError as e:
        print("Value error in facial verificaion", e)
        err = str(e).lower()
        return False
    except Exception as e:
        print("Facial verification err", e)
        logger.error(f"Error in facial recog - {e}")
        raise HTTPException(
            status_code=500, detail=f"Face verification failed: {str(e)}"
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
        if not verification_status or (
            not verification_status.is_facial_verified
            and not verification_status.overriding_user
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary has not been facially verified yet",
            )

        if not verification_status or (
            not verification_status.is_aadhar_verified
            and not verification_status.overriding_user
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary's aadhar is not verified yet",
            )

        is_requested_for_upgrade: bool = bool(
            db.scalar(
                select(exists().where(UpgradeRequest.candidate_id == candidate_id))
            )
        )

        verification_status.is_otp_verified = True
        db.add(verification_status)
        db.commit()
        db.refresh(verification_status)

        return {
            "msg": "OTP verified successfully",
            "data": {"is_requested_for_upgrade": is_requested_for_upgrade},
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in otp verification - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying OTP: {str(e)}",
        )


def get_issuance_details(candidate_id: str, db: Session):
    try:
        # Fetch IssuedStatus
        result = db.scalar(
            select(IssuedStatus)
            .options(joinedload(IssuedStatus.issued_user))
            .where(IssuedStatus.candidate_id == candidate_id)
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issuance details doesn't exist. Beneficiary didn't receive the laptop yet.",
            )

        # Fetch UpgradeRequest (optional)
        upgrade = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )

        # Convert ORM → Pydantic
        issuance_data = v_schemas.IsuedStatusItem.model_validate(result)

        upgrade_data = None
        is_upgrade = False

        if upgrade:
            upgrade_data = v_schemas.UpgradeRequestItem.model_validate(upgrade)
            is_upgrade = True

        # Final response
        return v_schemas.IssuedStatusWithUpgrade(
            issuance_details=issuance_data,
            is_upgrade_request=is_upgrade,
            upgrade_request_details=upgrade_data,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in getting issuance details - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching issuance details.",
        )


async def candidate_verification_consolidate(
    payload: v_schemas.ConsolidateVerificationRequest, db: Session, store_id: str
):
    msg = []
    verification_issues = []

    try:
        candidate = db.scalar(
            select(Candidate).where(
                or_(
                    Candidate.coupon_code == payload.coupon_code,
                    Candidate.gift_card_code == payload.coupon_code,
                )
            )
        )
    except Exception as e:
        logger.error(f"Error in getting candidate in consolidate verif - {e}")
        raise
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invalid Gift Card Code."
        )

    if not candidate.is_candidate_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Beneficiary details is not verified by the HR / Registration Officer yet",
        )

    if candidate.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="Beneficiary is not allotted to this store. Please contact admin team.",
        )

    verification_status_in = v_schemas.ConsolidateVerificationResponse(
        is_coupon_verified=True
    )

    try:
        issuanceDetails = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate.id)
        )
        if issuanceDetails and issuanceDetails.issued_status == "issued":
            result = {
                "verification_status": verification_status_in.model_dump(),
                "candidate": {
                    "candidate_id": candidate.id,
                    "photo": candidate.photo,
                    "full_name": candidate.full_name,
                    "mobile_number": candidate.mobile_number,
                },
                "is_already_issued": True,
                "failed_verifications": [],
                "requires_consent": False,
            }

            return {
                "msg": "Laptop has already been issued for beneficiary",
                "data": result,
            }
    except Exception as e:
        logger.error(f"Error in getting issuance etials in consolidate - {e}")
        pass

    # Aadhaar verification

    if candidate.verify_aadhar_number(payload.aadhar_number):
        verification_status_in.is_aadhar_verified = True
    else:
        verification_issues.append("aadhar")
        msg.append("Aadhaar number does not match.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aadhar number doesn't match",
        )

    if not candidate.photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary photo not registered.",
        )

    # Facial verification
    try:
        norm_input_img_path = normalize_path(payload.candidate_photo)
        norm_org_cand_path = normalize_path(candidate.photo)
        # is_spoof = check_spoof(norm_input_img_path)
        # if is_spoof:
        #     print(is_spoof)
        #     msg.append("Spoof detectected with beneficiary photo.")

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Final Error in consolidate - {e}")
        raise

    try:
        is_candidate_face_verified = await facial_recognition(
            img_path=norm_input_img_path, original_img=norm_org_cand_path
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in facial verification in consolidate verification - {e}")
        raise HTTPException(
            status_code=500, detail="Unexpected error in facial verification. Try again"
        )

    print(f"Candidate face in db: - {candidate.photo}")
    if is_candidate_face_verified:
        verification_status_in.is_facial_verified = True
    else:
        verification_issues.append("facial")
        msg.append("Facial recognition failed.")

    # Save verification status
    try:
        new_verification_status = db.get(VerificationStatus, candidate.id)
        if not new_verification_status:
            new_verification_status = VerificationStatus(
                candidate_id=candidate.id,
            )

        new_verification_status.is_facial_verified = (
            verification_status_in.is_facial_verified
        )
        new_verification_status.is_coupon_verified = (
            verification_status_in.is_coupon_verified
        )
        new_verification_status.is_aadhar_verified = (
            verification_status_in.is_aadhar_verified
        )
        new_verification_status.facial_verified_at = datetime.now(timezone.utc)
        new_verification_status.aadhar_verified_at = datetime.now(timezone.utc)
        new_verification_status.coupon_verified_at = datetime.now(timezone.utc)
        if new_verification_status.uploaded_candidate_photo:
            norm_existing_path = normalize_path(
                new_verification_status.uploaded_candidate_photo
            )
            if os.path.exists(norm_existing_path):
                os.remove(norm_existing_path)
        new_verification_status.uploaded_candidate_photo = payload.candidate_photo
        new_verification_status.entered_aadhar_number = payload.aadhar_number

        db.add(new_verification_status)
        db.commit()
        db.refresh(new_verification_status)

        verification_status_in.is_all_verified = all(
            [
                verification_status_in.is_facial_verified,
                verification_status_in.is_coupon_verified,
                verification_status_in.is_aadhar_verified,
            ]
        )

        response_data = {
            "verification_status": verification_status_in.model_dump(),
            "candidate": {
                "candidate_id": candidate.id,
                "photo": candidate.photo,
                "full_name": candidate.full_name,
                "mobile_number": candidate.mobile_number,
            },
            "failed_verifications": verification_issues,
            "requires_consent": not verification_status_in.is_all_verified,
            "is_already_issued": False,
        }

        if verification_status_in.is_all_verified:
            return {
                "msg": "All verifications passed. Proceed to OTP verification.",
                "data": response_data,
            }
        else:
            return {
                "msg": " ".join(msg) + " Store agent consent required to proceed.",
                "data": response_data,
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Unexpected error while verifying the beneficiary, Try again - {e}"
        )
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while verifying the beneficiary, Try again",
        )


def override_verification_process(
    candidate_id: str, payload: v_schemas.OverridingRequest, db: Session, user: UserOut
):
    """
    Store agent can give consent to proceed despite verification failures
    """

    # Update verification status to mark consent was given
    try:
        verification_status = db.get(VerificationStatus, candidate_id)
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary verification process is not initiated",
            )
        if not verification_status.is_coupon_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Beneficiary's voucher code is not yet verified",
            )
        verification_status.overriding_user = user.full_name or ""
        verification_status.overriding_reason = payload.overriding_reason

        db.add(verification_status)
        db.commit()

        return {
            "msg": "Verification process overridden. Proceed to OTP verification.",
            "data": {"can_proceed_to_otp": True},
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in overriding verification process - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while overriding verification process. Try again",
        )


async def upload_laptop_issuance_details(
    payload: v_schemas.LaptopIssueRequest, db: Session, user_id: str, candidate_id: str
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
            issued_status = IssuedStatus(
                candidate_id=candidate_id,
                issued_status="issued",
                issued_at=datetime.now(timezone.utc),
                issued_laptop_serial=payload.laptop_serial,
                store_employee_mobile=payload.store_employee_mobile,
                store_employee_name=payload.store_employee_name,
                bill_reciept=payload.bill_reciept,
                evidence_photo=payload.evidence_photo,
                store_employee_photo=payload.store_employee_photo,
                issued_by=user_id,
            )
        else:
            issued_status.issued_status = "issued"
            issued_status.issued_at = datetime.now(timezone.utc)
            issued_status.issued_laptop_serial = payload.laptop_serial

            issued_status.store_employee_mobile = payload.store_employee_mobile
            issued_status.store_employee_name = payload.store_employee_name

            issued_status.bill_reciept = payload.bill_reciept
            issued_status.evidence_photo = payload.evidence_photo
            issued_status.store_employee_photo = payload.store_employee_photo
            issued_status.issued_by = user_id

        db.add(issued_status)
        db.commit()
        db.refresh(issued_status)

        result = db.scalar(
            select(IssuedStatus).outerjoin(
                UpgradeRequest, IssuedStatus.candidate_id == UpgradeRequest.candidate_id
            )
        )
        return result

    except HTTPException:
        raise

    except IntegrityError as e:
        db.rollback()
        error_message = str(e.orig)

        if "Duplicate entry" in error_message:
            if (
                ".issued_laptop_serial" in error_message
                or "key 'issued_laptop_serial'" in error_message
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Laptop serail number already exists.",
                )

    except Exception as e:
        logger.error(f"Error in uploading issuance details - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error in updating issued status. Try again",
                "err_stack": str(e),
            },
        )


def get_latest_issuer_details(db: Session, store_user_id: str):
    try:
        latest_issued_status = db.scalar(
            select(IssuedStatus)
            .where(IssuedStatus.issued_by == store_user_id)
            .order_by(IssuedStatus.issued_at.desc())
            .limit(1)
        )
        if not latest_issued_status:
            return
        return v_schemas.LatestIssuer.model_validate(latest_issued_status)
    except Exception as e:
        logger.error(f"Error in getting latest issuer details - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching latest Issuer details.",
        )


def verify_for_upgrade(
    payload: v_schemas.RequestForUploadPayload, db: Session, store: StoreItemOut
):
    try:
        candidate_data = db.scalar(
            select(Candidate).where(Candidate.coupon_code == payload.coupon_code)
        )

        if not candidate_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invalid coupon code"
            )

        if candidate_data.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Beneficiary no assigned to this store",
            )
        if not candidate_data.verification_status or (
            candidate_data.verification_status
            and not candidate_data.verification_status.is_coupon_verified
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficary is not verified in the store yet.",
            )
        if not candidate_data.issued_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary did not recieve the laptop yet. Please issue the laptop and upgrade later.",
            )

        if (
            candidate_data.issued_status.issued_laptop_serial
            != payload.existing_laptop_serial
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Previous Laptop serial and given serial doesn't match.",
            )

        issuance_details = get_issuance_details(candidate_id=candidate_data.id, db=db)
        verified_by = (
            db.get(User, candidate_data.verified_by)
            if candidate_data.verified_by
            else None
        )
        verified_by_user = UserOut.model_validate(verified_by) if verified_by else None

        return {
            "msg": "Upgrade request is acceped.",
            "data": {
                "issuance_details": issuance_details,
                "candidate": CandidateItemWithStore(
                    id=candidate_data.id,
                    full_name=candidate_data.full_name,
                    mobile_number=candidate_data.mobile_number,
                    dob=candidate_data.dob,
                    state=candidate_data.state,
                    city=candidate_data.city,
                    division=candidate_data.division,
                    store_id=candidate_data.store_id,
                    photo=candidate_data.photo if candidate_data.photo else None,
                    issued_status=candidate_data.issued_status.issued_status
                    if candidate_data.issued_status
                    else "not_issued",
                    vendor_spoc_id=candidate_data.vendor_spoc_id,
                    aadhar_number=candidate_data.aadhar_number_masked,
                    aadhar_photo=candidate_data.aadhar_photo
                    if candidate_data.aadhar_photo
                    else None,
                    is_candidate_verified=candidate_data.is_candidate_verified,
                    coupon_code=candidate_data.coupon_code,
                    verified_by=verified_by_user,
                    gift_card_code=candidate_data.gift_card_code,
                    store=StoreItemOut(
                        name=store.name,
                        id=store.id,
                        city=store.city,
                        count=store.count,
                        email=store.email,
                        mobile_number=store.mobile_number,
                    )
                    if store
                    else None,
                ),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in verifying for upgrade - {e}")
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error requesting for upgrade.",
        )


def confirm_upgrade(
    db: Session,
    payload: v_schemas.RequestForUploadPayload,
    store: StoreItemOut,
):
    try:
        candidate_data = db.scalar(
            select(Candidate).where(Candidate.coupon_code == payload.coupon_code)
        )

        if not candidate_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invalid coupon code"
            )

        if candidate_data.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Beneficiary no assigned to this store",
            )
        if not candidate_data.verification_status or (
            candidate_data.verification_status
            and not candidate_data.verification_status.is_coupon_verified
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficary is not verified in the store yet.",
            )
        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_data.id)
        )
        if not issued_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary did not recieve the laptop yet. Please issue the laptop and upgrade later.",
            )

        if issued_status.issued_laptop_serial != payload.existing_laptop_serial:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Previous Laptop serial and given serial doesn't match.",
            )

        issued_status.is_requested_to_upgrade = True
        db.commit()
        db.refresh(issued_status)
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error_message = str(e.orig)

        if "Duplicate entry" in error_message:
            if (
                ".issued_laptop_serial" in error_message
                or "key 'issued_laptop_serial'" in error_message
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Laptop serail number already exists.",
                )
    except Exception as e:
        print(e)
        logger.error(f"Error in confirming for upgrade - {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error confirming upgrade request",
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
        logger.error(f"Error in uploading laptop evidence - {e}")

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
        logger.error(f"Error in uploading bill - {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding reciept photo. Try again.",
        )


def request_new_upgrade(
    candidate_id: str,
    db: Session,
    store: StoreItemOut,
    payload: v_schemas.RequestNewUpgradePayload | None,
):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary Not found"
            )
        if candidate.store and candidate.store.id != store.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Benficairy is not alloted to your store.",
            )

        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary details are not yet verified in store.",
            )
        if not verification_status.is_coupon_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary voucher code is not yet verified in store.",
            )
        if (
            not any(
                [
                    verification_status.is_aadhar_verified,
                    verification_status.is_facial_verified,
                ]
            )
            and not verification_status.overriding_reason
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary's verfication process is failed, please re-verify.",
            )
        candidate_issued_status = candidate.issued_status
        if (
            candidate_issued_status
            and candidate_issued_status.issued_status == "issued"
        ):
            return {
                "msg": "Beneficiary already recieved the laptop.",
                "data": {
                    "issuance_info": v_schemas.IssuedStatusWithUpgrade(
                        issuance_details=v_schemas.IsuedStatusItem.model_validate(
                            candidate_issued_status
                        ),
                        is_upgrade_request=candidate_issued_status.is_requested_to_upgrade,
                    ),
                    "is_already_issued": True,
                },
            }
        existing_upgrade = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate.id)
        )

        if existing_upgrade and not existing_upgrade.is_accepted:
            return {
                "msg": "Already requested for upgrade",
                "data": {
                    "issuance_info": v_schemas.UpgradeRequestOut.model_validate(
                        existing_upgrade
                    ),
                    "is_already_issued": False,
                },
            }
        new_upgrade = UpgradeRequest(
            candidate_id=candidate_id,
            is_accepted=False,
            cost_of_upgrade=payload.cost_of_upgrade if payload else 0,
            upgrade_product_info=payload.upgrade_product_info if payload else None,
            scheduled_at=payload.scheduled_at if payload else date.today(),
        )
        db.add(new_upgrade)
        db.commit()
        db.refresh(new_upgrade)
        return {
            "msg": "Upgrade for laptop requested successfully.",
            "data": {
                "issuance_info": v_schemas.UpgradeRequestOut.model_validate(
                    new_upgrade
                ),
                "is_already_issued": False,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in requesting new for upgrade - {e}")

        print("UPGRADE REQUEST ERR", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error requesting for upgrade",
        )


def close_upgrade_request(
    candidate_id: str,
    db: Session,
    payload: v_schemas.UpgradeClosurePayload,
    current_user: UserOut,
):
    try:
        existing_upgrade_request = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )

        issued_status = db.scalar(
            select(IssuedStatus).where(IssuedStatus.candidate_id == candidate_id)
        )
        if issued_status and issued_status.issued_status == "issued":
            return {
                "msg": "Beneficiary already recieved laptop",
                "data": {
                    "issuance_info": v_schemas.IssuedStatusWithUpgrade(
                        issuance_details=v_schemas.IsuedStatusItem.model_validate(
                            issued_status
                        ),
                        is_upgrade_request=issued_status.is_requested_to_upgrade,
                        upgrade_request_details=v_schemas.UpgradeRequestItem.model_validate(
                            existing_upgrade_request
                        )
                        if existing_upgrade_request
                        else None,
                    ),
                    "is_already_issued": True,
                },
            }

        if not existing_upgrade_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Upgrade for request not found",
            )
        new_issued_status = IssuedStatus(
            candidate_id=candidate_id,
            issued_status="issued",
            issued_at=datetime.now(timezone.utc),
            issued_laptop_serial=payload.laptop_issue_details.laptop_serial,
            issued_by=current_user.id,
            is_requested_to_upgrade=True,
            evidence_photo=payload.laptop_issue_details.evidence_photo,
            bill_reciept=payload.laptop_issue_details.bill_reciept,
            store_employee_name=payload.laptop_issue_details.store_employee_name,
            store_employee_mobile=payload.laptop_issue_details.store_employee_mobile,
            store_employee_photo=payload.laptop_issue_details.store_employee_photo,
        )

        existing_upgrade_request.is_accepted = True
        existing_upgrade_request.cost_of_upgrade = (
            payload.upgrade_details.cost_of_upgrade
        )
        existing_upgrade_request.upgrade_product_info = (
            payload.upgrade_details.upgrade_product_info
        )
        existing_upgrade_request.new_laptop_serial = (
            payload.laptop_issue_details.laptop_serial
        )
        db.add(new_issued_status)
        db.commit()
        db.refresh(new_issued_status)
        db.refresh(existing_upgrade_request)
        return {
            "msg": "Beneficiary already recieved laptop",
            "data": v_schemas.IssuedStatusWithUpgrade(
                issuance_details=v_schemas.IsuedStatusItem.model_validate(
                    new_issued_status
                ),
                is_upgrade_request=new_issued_status.is_requested_to_upgrade,
                upgrade_request_details=v_schemas.UpgradeRequestItem.model_validate(
                    existing_upgrade_request
                )
                if existing_upgrade_request
                else None,
            ),
        }

    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        error_message = str(e.orig)

        if "Duplicate entry" in error_message:
            if (
                ".issued_laptop_serial" in error_message
                or "key 'issued_laptop_serial'" in error_message
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Laptop serail number already exists.",
                )
    except Exception as e:
        logger.error(f"Error in closing upgrade - {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error in upgrading the laptop",
        )


def procees_with_no_upgrade(candidate_id: str, db: Session):
    try:
        existing_upgrade = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )
        if existing_upgrade:
            db.delete(existing_upgrade)
            db.commit()
        return {"msg": "Proceed with no upgrade"}

    except Exception as e:
        logger.error(f"Error in processig with no upgrade - {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error proceeding with no upgrade. Try again",
        )


def get_upgrade_details(candidate_id: str, db: Session):
    try:
        upgrade_details = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )

        if not upgrade_details:
            return None
        return {
            "msg": "Fetched upgrade details",
            "data": v_schemas.UpgradeRequestOut.model_validate(upgrade_details),
        }
    except Exception as e:
        logger.error(f"Error in getting upgrade details - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching upgrade details",
        )


# -------------OLD------------


def new_request_upgrade(
    candidate_id: str,
    db: Session,
    store: StoreItemOut,
    payload: v_schemas.UpgradeRequestPayload,
):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Beneficairy not found"
            )
        if candidate.store and candidate.store.id != store.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Benficairy is not alloted to your store.",
            )

        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary details are not yet verified in store.",
            )
        if not verification_status.is_coupon_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary voucher code is not yet verified in store.",
            )
        if (
            not any(
                [
                    verification_status.is_aadhar_verified,
                    verification_status.is_facial_verified,
                ]
            )
            and not verification_status.overriding_reason
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary's verfication process is failed, please re-verify.",
            )

        candidate_issued_status = candidate.issued_status

        if not candidate_issued_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary did not recieve the laptop yet. Please issue the laptop and upgrade later.",
            )

        if candidate_issued_status.issued_status != "issued":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary did not recieve the product yet, cannot upgrade now. Issue the product first",
            )

        new_upgrade = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )
        if not new_upgrade:
            new_upgrade = UpgradeRequest(
                candidate_id=candidate_id,
                cost_of_upgrade=payload.cost_of_upgrade,
                upgrade_product_info=payload.upgrade_product_info,
                new_laptop_serial=payload.new_laptop_serial,
                upgrade_reason=payload.upgrade_reason,
                upgrade_product_type=payload.upgrade_product_type,
            )
            db.add(new_upgrade)

        else:
            for key, val in payload.model_dump().items():
                if hasattr(new_upgrade, key):
                    setattr(new_upgrade, key, val)

        if payload.new_laptop_serial:
            new_upgrade.new_laptop_serial = payload.new_laptop_serial

        db.commit()
        db.refresh(new_upgrade)
        return {"msg": "Upgrade request has been raised.", "data": ""}

    except HTTPException:
        raise
    except Exception as e:
        print(e)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error in requesting fot upgrade",
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
