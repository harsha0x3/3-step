from models.candidates import Candidate
from sqlalchemy import select, and_
from sqlalchemy.orm import Session
from models.schemas.candidate_schemas import (
    NewCandidatePayload,
    CandidatesSearchParams,
    CandidateItemWithStore,
    UpdatedCandidatePayload,
)
from sqlalchemy.exc import IntegrityError
from utils.helpers import generate_readable_id
from models.stores import Store
from fastapi import HTTPException, status, UploadFile
from models.schemas.auth_schemas import UserOut
import time
from models.schemas.store_schemas import StoreItemWithUser
import os
from utils.helpers import save_image_file, get_relative_upload_path

MAX_RETRIES = 3


def add_new_candidate(payload: NewCandidatePayload, db: Session):
    try:
        # Check if store exists
        store = db.get(Store, payload.store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )

        # Retry loop for generating unique candidate ID
        for attempt in range(MAX_RETRIES):
            try:
                candidate_id = generate_readable_id("CAND")
                new_candidate = Candidate(
                    id=candidate_id,
                    full_name=payload.full_name,
                    gender=payload.gender,
                    dob=payload.dob,
                    mobile_number=payload.mobile_number,
                    email=payload.email,
                    disability_type=payload.disability_type,
                    address=payload.address,
                    city=payload.city,
                    state=payload.state,
                    store_id=payload.store_id,
                    photo_url="",
                    aadhar_last_four_digits=payload.aadhar_number[-4:],
                    parent_employee_code=payload.parent_employee_code,
                    parent_mobile_number=payload.parent_mobile_number,
                    parent_email=payload.parent_email,
                    parent_relation=payload.parent_relation,
                )

                new_candidate.set_aadhar_number(payload.aadhar_number)

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
                    if "id" in error_message:
                        # Retry if duplicate ID
                        if attempt < MAX_RETRIES - 1:
                            time.sleep(0.1)
                            continue
                        raise HTTPException(
                            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Failed to generate unique candidate ID after several attempts.",
                        )

                    elif "aadhar" in error_message:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="A candidate with this Aadhar number already exists.",
                        )

                    elif "mobile_number" in error_message:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="A candidate with this mobile number already exists.",
                        )

                    elif "email" in error_message:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="A candidate with this email already exists.",
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
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )
        if not candidate.is_candidate_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Candidate is not verified yet",
            )

        return candidate

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidate by ID", "err_stack": str(e)},
        )


def get_candidate_details_by_id(candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )
        store = candidate.store
        store_person = store.store_person
        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            gender=candidate.gender,
            dob=candidate.dob,
            aadhar_last_four_digits=candidate.aadhar_last_four_digits,
            mobile_number=candidate.mobile_number,
            email=candidate.email,
            disability_type=candidate.disability_type,
            address=candidate.address,
            city=candidate.city,
            state=candidate.state,
            store_id=candidate.store_id,
            photo_url=get_relative_upload_path(candidate.photo_url)
            if candidate.photo_url
            else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            parent_photo_url=get_relative_upload_path(candidate.parent_photo_url)
            if candidate.parent_photo_url
            else None,
            parent_name=candidate.parent_name,
            parent_employee_code=candidate.parent_employee_code,
            parent_mobile_number=candidate.parent_mobile_number,
            parent_email=candidate.parent_email,
            is_candidate_verified=candidate.is_candidate_verified,
            parent_relation=candidate.parent_relation,
            coupon=candidate.coupon.coupon_code if candidate.coupon else None,
            store_with_user=StoreItemWithUser(
                store_name=store.store_name,
                id=store.id,
                contact_number=store.contact_number,
                email=store.email,
                address=store.address,
                city=store.city,
                state=store.state,
                maps_link=store.maps_link,
                store_person=UserOut.model_validate(store_person)
                if store.store_person
                else None,
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidate by ID", "err_stack": str(e)},
        )


def get_candidate_by_photo_url(photo_url, db: Session):
    try:
        candidate = db.scalar(
            select(Candidate).where(
                and_(Candidate.photo_url == photo_url, Candidate.is_candidate_verified)
            )
        )
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )
        print("Candidate found:", candidate)
        store = candidate.store
        store_person = store.store_person
        return CandidateItemWithStore(
            id=candidate.id,
            full_name=candidate.full_name,
            gender=candidate.gender,
            dob=candidate.dob,
            aadhar_last_four_digits=candidate.aadhar_last_four_digits,
            mobile_number=candidate.mobile_number,
            email=candidate.email,
            disability_type=candidate.disability_type,
            address=candidate.address,
            city=candidate.city,
            state=candidate.state,
            store_id=candidate.store_id,
            photo_url=get_relative_upload_path(candidate.photo_url)
            if candidate.photo_url
            else None,
            issued_status=candidate.issued_status.issued_status
            if candidate.issued_status
            else "not_issued",
            parent_photo_url=get_relative_upload_path(candidate.parent_photo_url)
            if candidate.parent_photo_url
            else None,
            parent_name=candidate.parent_name,
            parent_employee_code=candidate.parent_employee_code,
            parent_mobile_number=candidate.parent_mobile_number,
            parent_email=candidate.parent_email,
            is_candidate_verified=candidate.is_candidate_verified,
            parent_relation=candidate.parent_relation,
            coupon=candidate.coupon.coupon_code if candidate.coupon else None,
            store_with_user=StoreItemWithUser(
                store_name=store.store_name,
                id=store.id,
                contact_number=store.contact_number,
                email=store.email,
                address=store.address,
                city=store.city,
                state=store.state,
                maps_link=store.maps_link,
                store_person=UserOut.model_validate(store_person)
                if store.store_person
                else None,
            ),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidate by photo", "err_stack": str(e)},
        )


def get_all_candidates(db: Session, params: CandidatesSearchParams | None = None):
    try:
        query = select(Candidate).where(Candidate.is_candidate_verified)

        if params and params.search_by and params.search_term:
            column_attr = getattr(Candidate, params.search_by)
            query = query.where(column_attr.ilike(f"%{params.search_term}%"))

        candidates = db.scalars(query).all()
        result = []
        count = 0
        for candidate in candidates:
            count += 1
            store = candidate.store
            store_person = store.store_person
            print(str(candidate.issued_status))
            data = CandidateItemWithStore(
                id=candidate.id,
                full_name=candidate.full_name,
                gender=candidate.gender,
                dob=candidate.dob,
                aadhar_last_four_digits=candidate.aadhar_last_four_digits,
                mobile_number=candidate.mobile_number,
                email=candidate.email,
                disability_type=candidate.disability_type,
                address=candidate.address,
                city=candidate.city,
                state=candidate.state,
                store_id=candidate.store_id,
                photo_url=get_relative_upload_path(candidate.photo_url)
                if candidate.photo_url
                else None,
                issued_status=candidate.issued_status.issued_status
                if candidate.issued_status
                else "not_issued",
                parent_photo_url=get_relative_upload_path(candidate.parent_photo_url)
                if candidate.parent_photo_url
                else None,
                parent_name=candidate.parent_name,
                parent_employee_code=candidate.parent_employee_code,
                parent_mobile_number=candidate.parent_mobile_number,
                parent_email=candidate.parent_email,
                is_candidate_verified=candidate.is_candidate_verified,
                parent_relation=candidate.parent_relation,
                coupon=candidate.coupon.coupon_code if candidate.coupon else None,
                store_with_user=StoreItemWithUser(
                    store_name=store.store_name,
                    id=store.id,
                    contact_number=store.contact_number,
                    email=store.email,
                    address=store.address,
                    city=store.city,
                    state=store.state,
                    maps_link=store.maps_link,
                    store_person=UserOut.model_validate(store_person)
                    if store.store_person
                    else None,
                ),
            )
            result.append(data)
        print("Total candidates fetched:", count)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidates", "err_stack": str(e)},
        )


def get_candidates_of_store(db: Session, store_id: str):
    try:
        store = db.get(Store, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )
        print("Store ID", store_id)
        candidates = db.scalars(
            select(Candidate).where(
                and_(Candidate.store_id == store_id, Candidate.is_candidate_verified)
            )
        ).all()
        print("Candidates length", len(candidates))
        result = []
        for candidate in candidates:
            print("Candidate", candidate)
            store = candidate.store
            data = CandidateItemWithStore(
                id=candidate.id,
                full_name=candidate.full_name,
                gender=candidate.gender,
                dob=candidate.dob,
                aadhar_last_four_digits=candidate.aadhar_last_four_digits,
                mobile_number=candidate.mobile_number,
                email=candidate.email,
                disability_type=candidate.disability_type,
                address=candidate.address,
                city=candidate.city,
                state=candidate.state,
                store_id=candidate.store_id,
                parent_name=candidate.parent_name,
                parent_employee_code=candidate.parent_employee_code,
                parent_mobile_number=candidate.parent_mobile_number,
                parent_email=candidate.parent_email,
                photo_url=get_relative_upload_path(candidate.photo_url)
                if candidate.photo_url
                else None,
                issued_status=candidate.issued_status.issued_status
                if candidate.issued_status
                else "not_issued",
                parent_photo_url=get_relative_upload_path(candidate.parent_photo_url)
                if candidate.parent_photo_url
                else None,
                parent_relation=candidate.parent_relation,
                is_candidate_verified=candidate.is_candidate_verified,
                coupon=candidate.coupon.coupon_code if candidate.coupon else None,
            )
            result.append(data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidates for store", "err_stack": str(e)},
        )


def update_candidate_details(
    candidate_id: str, payload: UpdatedCandidatePayload, db: Session
):
    """
    Update an existing candidate record.
    - Ignores Aadhaar number if included.
    - Performs partial updates only on provided fields.
    """

    from models.candidates import Candidate  # local import to avoid circular deps

    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    # Prevent aadhaar_number or hashed value modification
    restricted_fields = ["aadhar_number", "aadhar_last_four_digits", "id"]
    update_payload = {
        k: v
        for k, v in payload.model_dump(exclude_none=True).items()
        if k not in restricted_fields
    }

    # No fields provided?
    if not update_payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No editable fields provided for update.",
        )

    try:
        # Dynamically update provided fields
        for field, value in update_payload.items():
            if hasattr(candidate, field):
                setattr(candidate, field, value)

        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        store = candidate.store

        return {
            "candidate": {
                "id": candidate.id,
                "full_name": candidate.full_name,
                "gender": candidate.gender,
                "dob": candidate.dob,
                "mobile_number": candidate.mobile_number,
                "email": candidate.email,
                "disability_type": candidate.disability_type,
                "address": candidate.address,
                "city": candidate.city,
                "state": candidate.state,
                "issued_status": candidate.issued_status.issued_status
                if candidate.issued_status
                else "not_issued",
                "photo_url": candidate.photo_url,
                "store_id": candidate.store_id,
                "parent_name": candidate.parent_name,
                "parent_employee_code": candidate.parent_employee_code,
                "parent_mobile_number": candidate.parent_mobile_number,
                "parent_email": candidate.parent_email,
                "parent_photo_url": candidate.parent_photo_url,
            },
            "store": {
                "id": store.id,
                "store_name": store.store_name,
                "city": store.city,
                "state": store.state,
            },
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update candidate: {str(e)}",
        )


async def upload_candidate_img(photo: UploadFile, candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )

        if candidate.photo_url is not None:
            if os.path.exists(candidate.photo_url):
                os.remove(candidate.photo_url)
                print("File deleted successfully.")
            else:
                print("File not found.")

        candidate_img_path = await save_image_file(
            candidate_id=candidate.id, store_id=candidate.store_id, photo=photo
        )

        candidate.photo_url = candidate_img_path

        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {"msg": "Candidate image added successfully"}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error adding candidate image to db", "err_stack": str(e)},
        )


async def upload_parent_img(photo: UploadFile, candidate_id: str, db: Session):
    try:
        candidate = db.get(Candidate, candidate_id)

        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
            )

        if candidate.photo_url is not None:
            if os.path.exists(candidate.photo_url):
                os.remove(candidate.photo_url)
                print("File deleted successfully.")
            else:
                print("File not found.")

        parent_img_path = await save_image_file(
            candidate_id=candidate.id,
            store_id=candidate.store_id,
            photo=photo,
            isParent=True,
        )

        candidate.parent_photo_url = parent_img_path

        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {"msg": "Candidate image added successfully"}

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error adding candidate image to db", "err_stack": str(e)},
        )


async def update_candidate_verification_status(
    candidate_id: str, is_verified: bool, db: Session
):
    try:
        candidate = get_candidate_by_id(candidate_id, db)
        candidate.is_candidate_verified = is_verified
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
                "msg": "Error updating candidate verification status",
                "err_stack": str(e),
            },
        )
