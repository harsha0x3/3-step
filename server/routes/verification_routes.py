from controllers.candidates_controller import (
    get_candidate_by_photo_url,
    get_candidate_by_id,
)
from controllers.verification_controller import (
    facial_recognition,
    otp_resend,
    verify_otp,
    upload_laptop_issuance,
    verify_coupon_code,
    add_coupon_code_to_candidate,
)
from controllers.store_controller import get_store_of_user
from utils.helpers import save_image_file
from models.verification_statuses import VerificationStatus


from db.connection import get_db_conn
from services.auth.deps import get_current_user
from models.schemas.auth_schemas import UserOut
from models.schemas.otp_schemas import OtpVerifyRequest


from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Path,
    Form,
)
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import Annotated
from pydantic import BaseModel

router = APIRouter(prefix="/verify", tags=["Verification"])


class AadharVerifyRequest(BaseModel):
    aadhar_number: str


class CandidateDetailsVerifyRequest(BaseModel):
    is_verified: bool


class CouponCodeRequest(BaseModel):
    coupon_code: str


@router.post("/candidate-aadhar/{candidate_id}")
async def verify_candidate_aadhar(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    aadhar_number: Annotated[AadharVerifyRequest, ""],
):
    try:
        if current_user.role != "admin" and current_user.role != "verifier":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to verify candidates",
            )

        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

        if not candidate.verify_aadhar_number(
            plain_aadhar_number=aadhar_number.aadhar_number
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Aadhaar number does not match.",
            )
        candidate.is_candidate_verified = True
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return {
            "msg": "Candidate details verified successfully.",
            "data": {
                "candidate": {
                    "id": candidate.id,
                    "full_name": candidate.full_name,
                    "store": {"store_name": candidate.store.store_name},
                },
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error verifying candidate details", "err_stack": str(e)},
        )


@router.post("/candidate-details/{candidate_id}")
async def verify_candidate_details(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[
        str,
        Path(title="Candidate ID"),
    ],
    payload: Annotated[CandidateDetailsVerifyRequest, ""],
):
    if current_user.role != "admin" or current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorised to verify candidates",
        )
    try:
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        candidate.is_candidate_verified = payload.is_verified
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error verifying candidate details", "err_stack": str(e)},
        )


@router.post("/find-candidate/face/{candidate_id}")
async def verify_candidate_via_face(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    photo: Annotated[UploadFile, File(title="Candidate's Photo")],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to verify candidates",
            )

        store = get_store_of_user(db=db, user=current_user)

        uploaded_img_path = await save_image_file(
            store_id=store.id, photo=photo, isVerify=True
        )
        verified_path = await facial_recognition(
            img_path=uploaded_img_path, store_id=store.id
        )

        candidate = get_candidate_by_photo_url(verified_path, db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        if candidate.id != candidate_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid candidate face. canidate face and ID entered before doesn't match",
            )

        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )

        if not verification_status:
            verification_status = VerificationStatus(
                candidate_id=candidate.id, is_facial_verified=True
            )
        else:
            verification_status.is_facial_verified = True

        db.add(verification_status)
        db.commit()
        db.refresh(verification_status)

        return {
            "msg": "Candidate Found.",
            "data": {
                "candidate": {
                    "id": candidate.id,
                    "full_name": candidate.full_name,
                    "store": {"store_name": candidate.store_with_user.store_name},
                },
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error verifying candidate", "err_stack": str(e)},
        )


@router.post("/otp/candidate/{candidate_id}")
async def verify_candidate_via_otp(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    input_otp: Annotated[OtpVerifyRequest, ""],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to verify candidates",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        otp_verification_result = await verify_otp(
            candidate_id=candidate_id, otp_input=input_otp.otp, db=db
        )
        return otp_verification_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error verifying candidate OTP", "err_stack": str(e)},
        )


@router.post("/add-coupon/candidate/{candidate_id}")
async def add_candidate_coupon_code(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    coupon: Annotated[CouponCodeRequest, ""],
):
    try:
        if current_user.role != "verifier":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to add coupons to candidates",
            )
        coupon_addition_result = await add_coupon_code_to_candidate(
            candidate_id=candidate_id, coupon_code=coupon.coupon_code, db=db
        )
        return {"msg": "Coupon code added successfully", "data": coupon_addition_result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error adding candidate coupon code",
                "err_stack": str(e),
            },
        )


@router.post("/verify-coupon/candidate/{candidate_id}")
async def verify_candidate_via_coupon(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    coupon: Annotated[CouponCodeRequest, ""],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to verify candidates",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        coupon_verification_result = await verify_coupon_code(
            candidate_id=candidate_id, coupon_code=coupon.coupon_code, db=db
        )
        return coupon_verification_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error verifying candidate coupon code",
                "err_stack": str(e),
            },
        )


@router.post("/otp/re-send/candidate/{candidate_id}")
async def resend_candidate_otp(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to resend candidate OTP",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        otp_resend_result = await otp_resend(candidate_id=candidate_id, db=db)
        return otp_resend_result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error resending candidate OTP", "err_stack": str(e)},
        )


@router.get("/status/candidate/{candidate_id}")
async def get_candidate_verification_status(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            verification_status = VerificationStatus(candidate_id=candidate.id)
            db.add(verification_status)
            db.commit()
            db.refresh(verification_status)
        return {
            "msg": "Verification status retrieved successfully",
            "data": verification_status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error retrieving candidate verification status",
                "err_stack": str(e),
            },
        )


@router.post("/laptop-issuance/candidate/{candidate_id}")
async def issue_candidate_laptop(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    photo: Annotated[UploadFile, File(title="Laptop Issuance Photo")],
    laptop_serial: Annotated[str, Form(...), ""],
):
    try:
        if current_user.role != "store_personnel":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
            )
        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate has not been verified yet",
            )
        if not verification_status.is_facial_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate has not been facially verified yet",
            )
        if not verification_status.is_otp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Candidate has not been OTP verified yet",
            )
        photo_url = await save_image_file(
            store_id=store.id,
            photo=photo,
            candidate_id=candidate_id,
            isLaptopIssuance=True,
        )
        issuance_result = await upload_laptop_issuance(
            candidate_id=candidate_id,
            db=db,
            photo_url=photo_url,
            laptop_serial=laptop_serial,
        )
        return {"msg": "Laptop issuance recorded successfully", "data": issuance_result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error recording laptop issuance",
                "err_stack": str(e),
            },
        )
