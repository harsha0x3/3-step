from models.candidates import Candidate
from sqlalchemy import select, and_, func, desc, asc, or_, case
from sqlalchemy.orm import Session
from models.schemas.candidate_schemas import (
    NewCandidatePayload,
    CandidatesSearchParams,
    CandidateItemWithStore,
    UpdatedCandidatePayload,
    CandidateOut,
    PartialCandidateItem,
)
from sqlalchemy.exc import IntegrityError
from utils.helpers import generate_readable_id
from models.stores import Store
from models.verification_statuses import VerificationStatus
from models import IssuedStatus
from fastapi import HTTPException, status, UploadFile
from models.schemas.auth_schemas import UserOut
from models.users import User
import time
from models.schemas.store_schemas import StoreItemOut
import os
from utils.helpers import (
    save_image_file,
    generate_coupon,
    save_aadhar_photo,
)

MAX_RETRIES = 3


def add_new_candidate(payload: NewCandidatePayload, db: Session):
    try:
        # Check if store exists
        store = db.get(Store, payload.store_id) if payload.store_id else None
        if payload.store_id and not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )

        # Retry loop for generating unique candidate ID
        for attempt in range(MAX_RETRIES):
            try:
                candidate_id = generate_readable_id("CAND")
                new_candidate = Candidate(
                    id=payload.id if payload.id else candidate_id,
                    full_name=payload.full_name,
                    dob=payload.dob,
                    mobile_number=payload.mobile_number,
                    city=payload.city,
                    state=payload.state,
                    store_id=payload.store_id if payload.store_id else None,
                    division=payload.division,
                    coupon_code=generate_coupon(),
                )

                db.add(new_candidate)
                db.commit()
                db.refresh(new_candidate)

                print("THE ID GENERATED in TRY", candidate_id)
                return {"candidate": new_candidate, "store": store}

            except IntegrityError as e:
                db.rollback()
                error_message = str(e.orig)

                if "Duplicate entry" in error_message:
                    # Check which column caused the duplicate error
                    if ".id" in error_message:
                        # Retry if duplicate ID
                        print(error_message)
                        if attempt < MAX_RETRIES - 1:
                            time.sleep(0.1)
                            continue
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to generate unique Employee ID after several attempts. Try again",
                        )
                    elif ".coupon_code" in error_message:
                        print(error_message)

                        # Retry if duplicate ID
                        if attempt < MAX_RETRIES - 1:
                            time.sleep(0.1)
                            continue
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to generate unique Coupon after several attempts. Try again",
                        )

                    elif ".mobile_number" in error_message:
                        print(error_message)

                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="An employee with this mobile number already exists. Try again",
                        )

                    else:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Duplicate entry detected: {error_message}",
                        )

                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Database error: {error_message}",
                    )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )


def get_candidate_by_id(candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        if not candidate.is_candidate_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employee is not verified yet",
            )

        store = candidate.store

        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            mobile_number=candidate.mobile_number,
            dob=candidate.dob,
            state=candidate.state,
            city=candidate.city,
            division=candidate.division,
            store_id=candidate.store_id,
            photo=candidate.photo if candidate.photo else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            vendor_spoc_id=candidate.vendor_spoc_id,
            aadhar_number=candidate.aadhar_number,
            aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
            is_candidate_verified=candidate.is_candidate_verified,
            coupon_code=candidate.coupon_code,
            store=StoreItemOut(
                name=store.name,
                id=store.id,
                city=store.city,
                email=store.email,
                mobile_number=store.mobile_number,
                address=store.address,
            )
            if store
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting Employee by ID", "err_stack": str(e)},
        )


def get_candidate_details_by_id(candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        store = candidate.store
        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            mobile_number=candidate.mobile_number,
            dob=candidate.dob,
            state=candidate.state,
            city=candidate.city,
            division=candidate.division,
            store_id=candidate.store_id,
            photo=candidate.photo if candidate.photo else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            vendor_spoc_id=candidate.vendor_spoc_id,
            aadhar_number=candidate.aadhar_number,
            aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
            is_candidate_verified=candidate.is_candidate_verified,
            coupon_code=candidate.coupon_code,
            store=StoreItemOut(
                name=store.name,
                id=store.id,
                city=store.city,
                email=store.email,
                mobile_number=store.mobile_number,
                address=store.address,
            )
            if store
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR")
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting employee by ID", "err_stack": str(e)},
        )


def get_candidate_details_by_coupon_code(coupon_code: str, db: Session):
    try:
        candidate = db.scalar(
            select(Candidate).where(Candidate.coupon_code == coupon_code)
        )
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid Voucher code.",
            )
        store = candidate.store
        verified_by_u = db.get(User, candidate.verified_by)
        verified_by_user = (
            UserOut.model_validate(verified_by_u) if candidate.verified_by else None
        )
        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            mobile_number=candidate.mobile_number,
            dob=candidate.dob,
            state=candidate.state,
            city=candidate.city,
            division=candidate.division,
            store_id=candidate.store_id,
            photo=candidate.photo if candidate.photo else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            vendor_spoc_id=candidate.vendor_spoc_id,
            aadhar_number=candidate.aadhar_number,
            aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
            is_candidate_verified=candidate.is_candidate_verified,
            coupon_code=candidate.coupon_code,
            verified_by=verified_by_user,
            store=StoreItemOut(
                name=store.name,
                id=store.id,
                city=store.city,
                address=store.address,
                email=store.email,
                mobile_number=store.mobile_number,
            )
            if store
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting employee by ID", "err_stack": str(e)},
        )


def get_candidate_by_photo_url(photo_url, db: Session):
    try:
        candidate = db.scalar(
            select(Candidate).where(
                and_(Candidate.photo == photo_url, Candidate.is_candidate_verified)
            )
        )
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )
        print("Candidate found:", candidate)
        store = candidate.store
        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            mobile_number=candidate.mobile_number,
            dob=candidate.dob,
            state=candidate.state,
            city=candidate.city,
            division=candidate.division,
            store_id=candidate.store_id,
            photo=candidate.photo if candidate.photo else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            vendor_spoc_id=candidate.vendor_spoc_id,
            aadhar_number=candidate.aadhar_number,
            aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
            is_candidate_verified=candidate.is_candidate_verified,
            coupon_code=candidate.coupon_code,
            store=StoreItemOut(
                name=store.name,
                id=store.id,
                city=store.city,
                address=store.address,
                email=store.email,
                mobile_number=store.mobile_number,
            )
            if store
            else None,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting employee by photo", "err_stack": str(e)},
        )


def get_all_candidates(db: Session, params: CandidatesSearchParams):
    try:
        stmt = select(Candidate)
        count_stats = db.execute(
            select(
                func.count(Candidate.id).label("total_candidates"),
                func.sum(case((Candidate.is_candidate_verified, 1), else_=0)).label(
                    "total_vouchers_issued"
                ),
                func.sum(
                    case((IssuedStatus.issued_status == "issued", 1), else_=0)
                ).label("total_laptops_issued"),
            )
        ).one()

        # Filter by verification
        if params.is_verified is not None:
            stmt = stmt.where(Candidate.is_candidate_verified == params.is_verified)

        # Filter by issued status
        if params.is_issued is not None:
            if params.is_issued:
                stmt = stmt.join(IssuedStatus).where(
                    IssuedStatus.issued_status == "issued"
                )
            else:
                stmt = stmt.join(IssuedStatus).where(
                    or_(
                        IssuedStatus.issued_status == "not_issued",
                        Candidate.issued_status.is_(None),
                    )
                )

        if params.store_id and params.store_id != "null":
            stmt = stmt.join(Store).where(Candidate.store_id == params.store_id)

        if params.search_by and params.search_term and params.search_term != "null":
            setattr(params, "page", -1)
            column_attr = getattr(Candidate, params.search_by)
            stmt = stmt.where(column_attr.ilike(f"%{params.search_term}%"))

        sort_col = getattr(Candidate, params.sort_by)

        if params.sort_order == "asc":
            sort_col = asc(sort_col)
        else:
            sort_col = desc(sort_col)

        if params.page >= 1:
            candidates = db.scalars(
                stmt.order_by(sort_col)
                .limit(params.page_size)
                .offset(params.page * params.page_size - params.page_size)
            ).all()
        else:
            candidates = db.scalars(stmt.order_by(sort_col)).all()

        result = []
        for candidate in candidates:
            verified_by = (
                db.get(User, candidate.verified_by) if candidate.verified_by else None
            )
            verified_by_user = (
                UserOut.model_validate(verified_by) if verified_by else None
            )
            store = candidate.store
            print(str(candidate.issued_status))
            data = CandidateItemWithStore(
                id=candidate.id,
                full_name=candidate.full_name,
                mobile_number=candidate.mobile_number,
                dob=candidate.dob,
                state=candidate.state,
                city=candidate.city,
                division=candidate.division,
                store_id=candidate.store_id,
                photo=candidate.photo if candidate.photo else None,
                issued_status=candidate.issued_status.issued_status
                if candidate.issued_status
                else "not_issued",
                vendor_spoc_id=candidate.vendor_spoc_id,
                aadhar_number=candidate.aadhar_number,
                aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
                is_candidate_verified=candidate.is_candidate_verified,
                coupon_code=candidate.coupon_code,
                verified_by=verified_by_user,
                store=StoreItemOut(
                    name=store.name,
                    id=store.id,
                    city=store.city,
                    address=store.address,
                    email=store.email,
                    mobile_number=store.mobile_number,
                )
                if store
                else None,
            )

            result.append(data)
        return {
            "msg": "Employees fetched successfully",
            "data": {
                "candidates": result,
                "total_count": count_stats.total_candidates,
                "total_vouchers_issued": count_stats.total_vouchers_issued,
                "total_laptops_issued": count_stats.total_laptops_issued,
                "count": len(result),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting Employees", "err_stack": str(e)},
        )


def get_candidates_of_store(db: Session, store_id: str, params: CandidatesSearchParams):
    try:
        store = db.get(Store, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )
        stmt = select(Candidate).where(
            and_(Candidate.store_id == store_id, Candidate.is_candidate_verified)
        )
        count_stats = db.execute(
            select(
                func.count(Candidate.id).label("total_count"),
                func.sum(
                    case((IssuedStatus.issued_status == "issued", 1), else_=0)
                ).label("total_laptops_issued"),
            )
            .where(
                and_(Candidate.store_id == store_id, Candidate.is_candidate_verified)
            )
            .outerjoin(IssuedStatus, IssuedStatus.candidate_id == Candidate.id)
        ).one()

        if params.search_by and params.search_term and params.search_term != "null":
            setattr(params, "page", -1)
            column_attr = getattr(Candidate, params.search_by)
            stmt = stmt.where(column_attr.ilike(f"%{params.search_term}%"))

        sort_col = getattr(Candidate, params.sort_by)

        if params.sort_order == "asc":
            sort_col = asc(sort_col)
        else:
            sort_col = desc(sort_col)

        if params.page >= 1:
            candidates = db.scalars(
                stmt.order_by(sort_col)
                .limit(params.page_size)
                .offset(params.page * params.page_size - params.page_size)
            ).all()
        else:
            candidates = db.scalars(stmt.order_by(sort_col)).all()

        result = []
        for candidate in candidates:
            print("Candidate", candidate)
            store = candidate.store
            data = PartialCandidateItem(
                id=candidate.id,
                full_name=candidate.full_name,
                mobile_number=candidate.mobile_number,
                is_candidate_verified=candidate.is_candidate_verified,
                issued_status=candidate.issued_status.issued_status
                if candidate.issued_status
                else "not_issued",
                store=StoreItemOut(
                    name=store.name,
                    id=store.id,
                    city=store.city,
                    address=store.address,
                    email=store.email,
                    mobile_number=store.mobile_number,
                )
                if store
                else None,
            )

            result.append(data)

        return {
            "msg": "Employees fetched for store",
            "data": {
                "candidates": result,
                "total_count": count_stats.total_count,
                "total_laptops_issued": count_stats.total_laptops_issued,
                "count": len(result),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting Employees for store", "err_stack": str(e)},
        )


def update_candidate_details(
    candidate_id: str,
    payload: UpdatedCandidatePayload,
    db: Session,
    verified_user_id: str,
):
    """
    Update an existing candidate record.
    - Ignores Aadhaar number if included.
    - Performs partial updates only on provided fields.
    """

    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    print(f"payload-dump - {payload.model_dump()}")

    try:
        # Dynamically update provided fields
        for field, value in payload.model_dump(exclude_unset=True).items():
            print(f"field - {field} , value - {value}")
            if hasattr(candidate, field):
                print(f"ATTR FOUND {field}")
                setattr(candidate, field, value)

        store = candidate.store

        if payload.is_candidate_verified:
            cand_out = CandidateOut.model_validate(candidate)
            is_cand_ready = is_candidate_ready_to_verify(cand_out.model_dump())
            if not is_cand_ready.get("status"):
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=is_cand_ready.get("msg"),
                )
            candidate.verified_by = verified_user_id
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            mobile_number=candidate.mobile_number,
            dob=candidate.dob,
            state=candidate.state,
            city=candidate.city,
            division=candidate.division,
            store_id=candidate.store_id,
            photo=candidate.photo if candidate.photo else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            vendor_spoc_id=candidate.vendor_spoc_id,
            aadhar_number=candidate.aadhar_number,
            aadhar_photo=candidate.aadhar_photo if candidate.aadhar_photo else None,
            is_candidate_verified=candidate.is_candidate_verified,
            coupon_code=candidate.coupon_code,
            store=StoreItemOut(
                name=store.name,
                id=store.id,
                city=store.city,
                address=store.address,
                email=store.email,
                mobile_number=store.mobile_number,
            )
            if store
            else None,
        )

    except IntegrityError as e:
        db.rollback()
        error_message = str(e.orig)

        if "Duplicate entry" in error_message:
            # Check which column caused the duplicate error
            if ".id" in error_message:
                # Retry if duplicate ID
                print(error_message)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Duplicate entry on Employee ID. Try again",
                )
            elif ".coupon_code" in error_message:
                print(error_message)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate unique Coupon after several attempts. Try again",
                )

            elif ".mobile_number" in error_message:
                print(error_message)

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="An employee with this mobile number already exists. Try again",
                )

            elif ".full_name" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Duplicate entry on employee name. Try again",
                )

            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Duplicate entry detected: {error_message}",
                )

        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error: {error_message}",
            )

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update Employee: {str(e)}",
        )


def is_candidate_ready_to_verify(payload):
    null_vals = []
    for key, val in payload.items():
        if not val and key not in ["issued_status", "aadhar_number"]:
            null_vals.append(key)
    if len(null_vals) > 0:
        return {
            "status": False,
            "msg": f"These fileds are empty please add them. {', '.join(null_vals)}",
        }
    return {"status": True, "msg": ""}


async def upload_candidate_img(photo: UploadFile, candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )

        if candidate.photo is not None:
            if os.path.exists(candidate.photo):
                os.remove(candidate.photo)

        candidate_img_path = await save_image_file(
            candidate_id=candidate.id, store_id=candidate.store_id, photo=photo
        )

        candidate.photo = candidate_img_path

        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {"msg": "Employee image added successfully"}

    except HTTPException:
        raise

    except Exception as e:
        print("PHOTO ERR")
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error adding employee image to db", "err_stack": str(e)},
        )


# async def upload_parent_img(photo: UploadFile, candidate_id: str, db: Session):
#     try:
#         candidate = db.get(Candidate, candidate_id)

#         if not candidate:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
#             )

#         if candidate.photo is not None:
#             if os.path.exists(candidate.photo_url):
#                 os.remove(candidate.photo_url)
#                 print("File deleted successfully.")
#             else:
#                 print("File not found.")

#         parent_img_path = await save_image_file(
#             candidate_id=candidate.id,
#             store_id=candidate.store_id,
#             photo=photo,
#             isParent=True,
#         )

#         candidate.parent_photo_url = parent_img_path

#         db.add(candidate)
#         db.commit()
#         db.refresh(candidate)

#         return {"msg": "Candidate image added successfully"}

#     except HTTPException:
#         raise

#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail={"msg": "Error adding candidate image to db", "err_stack": str(e)},
#         )


async def update_candidate_verification_status(
    candidate_id: str, is_verified: bool, db: Session
):
    try:
        candidate = get_candidate_by_id(candidate_id, db)
        candidate.is_candidate_verified = is_verified
        if is_verified:
            verification_status = db.scalar(
                select(VerificationStatus).where(
                    VerificationStatus.candidate_id == candidate_id
                )
            )
            if not verification_status:
                verification_status = VerificationStatus(candidate_id=candidate_id)
                db.add(verification_status)

        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        return candidate
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "msg": "Error updating employee verification status",
                "err_stack": str(e),
            },
        )


async def add_aadhar_photo(photo: UploadFile, candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
            )

        aadhar_photo = await save_aadhar_photo(photo=photo, candidate_id=candidate_id)
        candidate.aadhar_photo = aadhar_photo
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {"msg": "aadhar photo added successfully", "data": ""}

    except HTTPException:
        raise
    except Exception as e:
        print(f"AADHAR PGOTO ERR - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding aadhar photo",
        )
