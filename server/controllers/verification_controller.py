from services.verification_service.email_service import (
    send_otp_email,
    send_otp_to_admin,
)
from services.verification_service.mobile_notification_service import (
    send_beneficiary_sms_otp,
)

from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from models.candidates import Candidate
from models.otps import Otp
from datetime import datetime, timezone
from models.schemas.otp_schemas import CandidateInOtp, AdminOTPPayload, SmsOtpPayload
from models.schemas import verification_schemas as v_schemas
from models.schemas.store_schemas import StoreItemOut
from models.schemas.auth_schemas import UserOut
from models import IssuedStatus, VerificationStatus, UpgradeRequest
from deepface import DeepFace
import os
from utils.helpers import (
    normalize_path,
    ensure_utc,
    get_relative_upload_path,
    save_image_file,
)
from dotenv import load_dotenv
from datetime import datetime, timezone
from .candidates_controller import get_candidate_details_by_id

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


async def facial_recognition(img_path: str, original_img: str):
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
        raise HTTPException(
            status_code=422, detail="No face detected in the uploaded image"
        )
    except Exception as e:
        print("Facial verification err", e)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching issuance details.",
        )


async def candidate_verification_consolidate(
    payload: v_schemas.ConsolidateVerificationRequest, db: Session, store_id: str
):
    from .candidates_controller import get_candidate_details_by_coupon_code

    msg = []
    verification_issues = []

    try:
        candidate = get_candidate_details_by_coupon_code(
            coupon_code=payload.coupon_code, db=db
        )
    except Exception as e:
        raise

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
        pass

    # Aadhaar verification

    if candidate.aadhar_number == payload.aadhar_number:
        verification_status_in.is_aadhar_verified = True
    else:
        verification_issues.append("aadhar")
        msg.append("Aadhaar number does not match.")

    if not candidate.photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Beneficiary photo not registered.",
        )

    # Facial verification
    try:
        norm_input_img_path = normalize_path(payload.candidate_photo)
        norm_org_cand_path = normalize_path(candidate.photo)
        is_spoof = check_spoof(norm_input_img_path)
        if is_spoof:
            print(is_spoof)
            msg.append("Spoof detectected with beneficiary photo.")

    except HTTPException:
        raise

    except Exception as e:
        raise

    try:
        is_candidate_face_verified = await facial_recognition(
            img_path=norm_input_img_path, original_img=norm_org_cand_path
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Face verification failed: {str(e)}"
        )

    print(f"Candidate face in db: - {candidate.photo}")
    if is_candidate_face_verified and not is_spoof:
        print("is_spoof", is_spoof)
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
                new_verification_status.is_facial_verified,
                new_verification_status.is_coupon_verified,
                new_verification_status.is_aadhar_verified,
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

    except Exception as e:
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching latest Issuer details.",
        )


def request_upgrade(
    candidate_id: str,
    db: Session,
    store: StoreItemOut,
    payload: v_schemas.UpgradeRequestPayload,
):
    try:
        candidate = get_candidate_details_by_id(candidate_id=candidate_id, db=db)
        if candidate.issued_status == "issued":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary already recieved the product, cannot upgrade now.",
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
                detail="Beneficiary's verfication process is failed, please re-verify and override.",
            )

        new_upgrade = db.scalar(
            select(UpgradeRequest).where(UpgradeRequest.candidate_id == candidate_id)
        )
        if not new_upgrade:
            new_upgrade = UpgradeRequest(
                candidate_id=candidate_id, **payload.model_dump()
            )
            db.add(new_upgrade)

        else:
            for key, val in payload.model_dump().items():
                if hasattr(new_upgrade, key):
                    setattr(new_upgrade, key, val)

        db.commit()
        return {
            "msg": "Upgrade request has been raised.",
            "data": v_schemas.UpgradeRequestItem.model_validate(new_upgrade),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error in requesting fot upgrade",
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
