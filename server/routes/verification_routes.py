from controllers.candidates_controller import (
    get_candidate_by_photo_url,
    get_candidate_by_id,
    get_candidate_details_by_coupon_code,
)
from controllers.verification_controller import (
    facial_recognition,
    otp_resend,
    verify_otp,
    upload_laptop_issuance_details,
    upload_laptop_issuance_bill_reciept,
    upload_laptop_issuance_evidence,
    get_issuance_details,
    candidate_verification_consolidate,
    override_verification_process,
    get_latest_issuer_details,
)
from controllers.store_controller import get_store_of_user
from utils.helpers import save_image_file
from models.verification_statuses import VerificationStatus


from db.connection import get_db_conn
from services.auth.deps import get_current_user
from models.schemas.auth_schemas import UserOut
from models.schemas.otp_schemas import OtpVerifyRequest
from models.schemas import verification_schemas as v_schemas

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


@router.get("/issuance-details/candidate/{candidate_id}")
async def get_laptop_issuance_details(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

        result = get_issuance_details(candidate_id=candidate.id, db=db)
        return {"msg": "Issuance Status fetched successfully.", "data": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error fetching issuance details", "err_stack": str(e)},
        )


@router.post("/otp/candidate/{candidate_id}")
async def verify_candidate_via_otp(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    input_otp: Annotated[OtpVerifyRequest, ""],
):
    try:
        if (
            current_user.role != "store_agent"
            and current_user.role != "super_admin"
            and current_user.role != "admin"
        ):
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


@router.post("/otp/re-send/candidate/{candidate_id}")
async def resend_candidate_otp(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        if (
            current_user.role != "store_agent"
            and current_user.role != "super_admin"
            and current_user.role != "admin"
        ):
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


@router.post("/otp/send/to_admin/candidate/{candidate_id}")
async def send_otp_to_admin(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
):
    try:
        if (
            current_user.role != "store_agent"
            and current_user.role != "super_admin"
            and current_user.role != "admin"
        ):
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
        otp_resend_result = await otp_resend(
            candidate_id=candidate_id, db=db, to_admin=True
        )
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
        if current_user.role not in [
            "admin",
            "super_admin",
            "store_agent",
            "registration_officer",
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )

        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

        if current_user.role == "store_agent":
            store = get_store_of_user(db=db, user=current_user)
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
            "data": v_schemas.VerificaionStatusItem.model_validate(verification_status),
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


@router.post("/laptop-issuance/evidence/candidate/{candidate_id}")
async def add_laptop_issuace_evidence(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    photo: Annotated[UploadFile, File(title="Laptop Issuance Photo")],
):
    try:
        if current_user.role != "store_agent" and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee is not allotted to this store. Please check the candidate allotted store properly.",
            )
        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary Employee has not been verified yet",
            )
        if (
            not verification_status.is_facial_verified
            and not verification_status.overriding_user
        ):
            print(f"over - {verification_status.overriding_user}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been facially verified yet",
            )
        if (
            not verification_status.is_aadhar_verified
            and not verification_status.overriding_user
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee's aadhar is not verified yet",
            )
        if not verification_status.is_otp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been OTP verified yet",
            )
        return await upload_laptop_issuance_evidence(
            candidate_id=candidate.id,
            db=db,
            photo=photo,
            user_id=current_user.id,
            store_id=store.id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading evidence of laptop issuance",
        )


@router.post("/laptop-issuance/reciept/candidate/{candidate_id}")
async def add_laptop_issuace_reciept(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    photo: Annotated[UploadFile, File(title="Laptop Issuance Photo")],
):
    try:
        if current_user.role != "store_agent" and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee is not allotted to this store. Please check the candidate allotted store properly.",
            )
        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary Employee has not been verified yet",
            )
        if not verification_status.is_facial_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been facially verified yet",
            )
        if not verification_status.is_otp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been OTP verified yet",
            )
        return await upload_laptop_issuance_bill_reciept(
            candidate_id=candidate.id,
            db=db,
            photo=photo,
            user_id=current_user.id,
            store_id=store.id,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error uploading bill reciept of laptop issuance",
        )


@router.post("/laptop-issuance/candidate/{candidate_id}")
async def issue_candidate_laptop(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    candidate_id: Annotated[str, Path(title="Candidate ID")],
    laptop_serial: Annotated[str, Form(...), ""],
    store_employee_name: Annotated[str, Form(...), ""],
    store_employee_mobile: Annotated[str, Form(...), ""],
    evidence_photo: Annotated[UploadFile, File(...)],
    bill_photo: Annotated[UploadFile, File(title="Laptop Bill / Reciept Photo")],
    store_employee_photo: Annotated[
        UploadFile | None, File(title="store employee who is issuing the laptop")
    ] = None,
):
    import asyncio

    try:
        if current_user.role != "store_agent" and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to view candidate verification status",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee is not allotted to this store. Please check the candidate allotted store properly.",
            )
        verification_status = db.scalar(
            select(VerificationStatus).where(
                VerificationStatus.candidate_id == candidate.id
            )
        )
        if not verification_status:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Beneficiary Employee has not been verified yet",
            )
        if (
            not verification_status.is_facial_verified
            and not verification_status.overriding_user
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been facially verified yet",
            )
        if (
            not verification_status.is_aadhar_verified
            and not verification_status.overriding_user
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee's aadhar is not verified yet",
            )
        if not verification_status.is_otp_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee has not been OTP verified yet",
            )

        latest_issuer = get_latest_issuer_details(db=db, store_user_id=current_user.id)
        store_employee_photo_url = None
        if store_employee_photo:
            store_employee_photo_url = await save_image_file(
                store_id=store.id,
                photo=store_employee_photo,
                candidate_id=candidate_id,
                isLaptopIssuance=True,
                prefix="employee",
            )
        elif latest_issuer:
            store_employee_photo_url = latest_issuer.store_employee_photo

        else:
            raise HTTPException(
                status_code=400,
                detail="Store employee photo required for first issuance",
            )

        (
            bill_photo_url,
            evidence_photo_url,
        ) = await asyncio.gather(
            save_image_file(
                store_id=store.id,
                photo=bill_photo,
                candidate_id=candidate_id,
                isLaptopIssuance=True,
                prefix="bill",
            ),
            save_image_file(
                store_id=store.id,
                photo=evidence_photo,
                candidate_id=candidate_id,
                isLaptopIssuance=True,
                prefix="laptop",
            ),
        )

        payload = v_schemas.LaptopIssueRequest(
            laptop_serial=laptop_serial,
            evidence_photo=evidence_photo_url,
            bill_reciept=bill_photo_url,
            store_employee_photo=store_employee_photo_url,
            store_employee_name=store_employee_name,
            store_employee_mobile=store_employee_mobile,
        )

        issuance_result = await upload_laptop_issuance_details(
            payload=payload,
            candidate_id=candidate_id,
            db=db,
            user_id=current_user.id,
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


@router.post("/canidate-details/consolidate")
async def consolidate_verification_of_candidate(
    coupon_code: Annotated[str, Form(...)],
    photo: Annotated[UploadFile, File(...)],
    aadhar_number: Annotated[str, Form(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role not in ["super_admin", "store_agent"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to verify beneficiary",
            )

        store = get_store_of_user(db=db, user=current_user)

        uploaded_img_path = await save_image_file(
            store_id=store.id, photo=photo, isVerify=True, candidate_id=coupon_code
        )

        payload = v_schemas.ConsolidateVerificationRequest(
            coupon_code=coupon_code,
            candidate_photo=uploaded_img_path,
            aadhar_number=aadhar_number,
        )

        result = await candidate_verification_consolidate(
            payload=payload, db=db, store_id=store.id
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while verifying beneficiary",
        )


@router.post("/override/{candidate_id}")
async def overriding_verification_process(
    candidate_id: Annotated[str, Path(...)],
    payload: Annotated[v_schemas.OverridingRequest, ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role not in ["super_admin", "store_agent"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to verify beneficiary",
            )
        store = get_store_of_user(db=db, user=current_user)
        candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

        if store.id != candidate.store_id:
            raise HTTPException(
                status_code=status.HTTP_406_NOT_ACCEPTABLE,
                detail="Beneficiary is not allotted to this store. Please contact admin team.",
            )

        return override_verification_process(
            candidate_id=candidate_id, payload=payload, db=db, user=current_user
        )

    except HTTPException:
        raise


@router.get("/latest-issuer")
async def get_latest_issuer(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        if current_user.role not in ["super_admin", "store_agent"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized to verify beneficiary",
            )
        store = get_store_of_user(db=db, user=current_user)
        result = get_latest_issuer_details(db=db, store_user_id=current_user.id)
        return {"msg": "Latest issuer fetched successfully", "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected error while fetching latest issuer",
        )


### ---------------- NOT USING ------------- ###


# @router.post("/candidate-aadhar/{candidate_id}")
# async def verify_candidate_aadhar(
#     db: Annotated[Session, Depends(get_db_conn)],
#     current_user: Annotated[UserOut, Depends(get_current_user)],
#     candidate_id: Annotated[str, Path(title="Candidate ID")],
#     aadhar_number: Annotated[AadharVerifyRequest, ""],
# ):
#     try:
#         if (
#             current_user.role != "admin"
#             and current_user.role != "super_admin"
#             and current_user.role != "registration_officer"
#         ):
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Unauthorised to verify candidates",
#             )

#         candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)

#         if not candidate.verify_aadhar_number(
#             plain_aadhar_number=aadhar_number.aadhar_number
#         ):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Aadhaar number does not match.",
#             )
#         candidate.is_candidate_verified = True
#         db.add(candidate)
#         db.commit()
#         db.refresh(candidate)
#         return {
#             "msg": "Candidate details verified successfully.",
#             "data": {
#                 "candidate": {
#                     "id": candidate.id,
#                     "full_name": candidate.full_name,
#                     "store": {"name": candidate.store.name},
#                 },
#             },
#         }
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail={"msg": "Error verifying candidate details", "err_stack": str(e)},
#         )


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
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        or current_user.role != "registration_officer"
    ):
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
        if (
            current_user.role != "store_agent"
            and current_user.role != "super_admin"
            and current_user.role != "admin"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorised to verify candidates",
            )

        store = get_store_of_user(db=db, user=current_user)

        uploaded_img_path = await save_image_file(
            store_id=store.id, photo=photo, isVerify=True, candidate_id=candidate_id
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
                    "store": {
                        "name": candidate.store.name if candidate.store else None
                    },
                },
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error verifying candidate", "err_stack": str(e)},
        )


@router.get("/coupon-details/{coupon_code}", status_code=status.HTTP_200_OK)
async def get_candidate_by_coupon(
    coupon_code: Annotated[str, Path(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    store = None
    candidate = get_candidate_details_by_coupon_code(coupon_code, db)
    if current_user.role == "store_agent":
        if not candidate.is_candidate_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee is not verified by registration officer yet.",
            )
        store = get_store_of_user(db=db, user=current_user)
        if candidate.store_id != store.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Beneficiary Employee is not assigned to your store",
            )

    return {
        "msg": "Beneficiary Employee fetched successfully",
        "data": {"candidate": candidate},
    }


# @router.post("/add-coupon/candidate/{candidate_id}")
# async def add_candidate_coupon_code(
#     db: Annotated[Session, Depends(get_db_conn)],
#     current_user: Annotated[UserOut, Depends(get_current_user)],
#     candidate_id: Annotated[str, Path(title="Candidate ID")],
#     coupon: Annotated[CouponCodeRequest, ""],
# ):
#     try:
#         if current_user.role != "registration_officer":
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Unauthorised to add coupons to candidates",
#             )
#         coupon_addition_result = await add_coupon_code_to_candidate(
#             candidate_id=candidate_id, coupon_code=coupon.coupon_code, db=db
#         )
#         return {"msg": "Coupon code added successfully", "data": coupon_addition_result}
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail={
#                 "msg": "Error adding candidate coupon code",
#                 "err_stack": str(e),
#             },
#         )


# @router.post("/verify-coupon/candidate/{candidate_id}")
# async def verify_candidate_via_coupon(
#     db: Annotated[Session, Depends(get_db_conn)],
#     current_user: Annotated[UserOut, Depends(get_current_user)],
#     candidate_id: Annotated[str, Path(title="Candidate ID")],
#     coupon: Annotated[CouponCodeRequest, ""],
# ):
#     try:
#         if current_user.role != "store_agent" and current_user.role != "super_admin" and current_user.role != "admin":
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="Unauthorised to verify candidates",
#             )
#         store = get_store_of_user(db=db, user=current_user)
#         candidate = get_candidate_by_id(candidate_id=candidate_id, db=db)
#         if candidate.store_id != store.id:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Candidate is not allotted to this store. Please check the candidate allotted store properly.",
#             )
#         coupon_verification_result = await verify_coupon_code(
#             candidate_id=candidate_id, coupon_code=coupon.coupon_code, db=db
#         )
#         return coupon_verification_result
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail={
#                 "msg": "Error verifying candidate coupon code",
#                 "err_stack": str(e),
#             },
#         )
