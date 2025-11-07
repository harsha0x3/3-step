from models.schemas.store_schemas import (
    AddNewStore,
    StoreSearchParams,
    StoreItemWithUser,
)
from utils.helpers import generate_readable_id
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.stores import Store
from models.users import User
from models.schemas.auth_schemas import UserOut
from services.auth.utils import build_otpauth_uri
from sqlalchemy.exc import IntegrityError
import time

MAX_RETRIES = 3


def add_new_store(payload: AddNewStore, db: Session):
    try:
        existing_user = db.scalar(select(User).where(User.email == payload.email))
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Store with the email already exists",
            )
        new_store_password = "Password@123"
        new_store_in_user = User(
            username=payload.store_name,
            email=payload.email,
            first_name=payload.store_person_first_name,
            last_name=payload.store_person_last_name,
            role="store_personnel",
            mfa_enabled=True,
        )
        new_store_in_user.set_password(new_store_password)
        recovery_codes = new_store_in_user.enable_mfa()
        mfa_uri = new_store_in_user.get_mfa_uri()

        db.add(new_store_in_user)
        db.commit()
        db.refresh(new_store_in_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error creating credentials for store", "err_stack": str(e)},
        )

    for attempt in range(MAX_RETRIES):
        try:
            store_id = generate_readable_id("STORE")
            new_store = Store(
                store_name=payload.store_name,
                id=store_id,
                contact_person_id=new_store_in_user.id,
                contact_number=payload.store_contact_number,
                email=new_store_in_user.email,
                address=payload.address,
                city=payload.city,
                state=payload.state,
                maps_link=payload.maps_link,
            )

            db.add(new_store)
            db.commit()
            db.refresh(new_store)
            return {
                "store": new_store,
                "store_credentials": UserOut.model_validate(new_store_in_user),
            }

        except IntegrityError as e:
            db.rollback()

            if "Duplicate entry" in str(e.orig) and "id" in str(e.orig):
                if attempt < MAX_RETRIES - 1:
                    time.sleep(0.1)
                    continue
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to generate unique store ID after several attempts",
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {str(e)}",
                )

        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error adding new store: {str(e)}",
            )


async def get_all_stores(db: Session, params: StoreSearchParams | None = None):
    try:
        query = select(Store)

        if params and params.search_by and params.search_term:
            if params.search_by.lower() == "id":
                query = query.where(Store.id.ilike(f"%{params.search_term}%"))
            elif params.search_by.lower() == "store_name":
                query = query.where(Store.store_name.ilike(f"%{params.search_term}%"))
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid search_by value: {params.search_by}. Must be 'store_id' or 'store_name'.",
                )

        stores = db.scalars(query).all()
        result = []
        for store in stores:
            result.append(
                StoreItemWithUser(
                    store_name=store.store_name,
                    id=store.id,
                    contact_number=store.contact_number,
                    email=store.email,
                    address=store.address,
                    city=store.city,
                    state=store.state,
                    maps_link=store.maps_link,
                    store_person=UserOut(
                        id=store.store_person.id,
                        username=store.store_person.username,
                        email=store.store_person.email,
                        first_name=store.store_person.first_name,
                        last_name=store.store_person.last_name,
                        role=store.store_person.role,
                        mfa_secret=build_otpauth_uri(
                            secret=store.store_person.mfa_secret,
                            email=store.store_person.email,
                            issuer="Laptop Distribution",
                        ),
                        created_at=store.store_person.created_at,
                        updated_at=store.store_person.updated_at,
                    )
                    if store.store_person
                    else None,
                )
            )
        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error retrieving stores", "err_stack": str(e)},
        )


def get_store_of_user(db: Session, user: UserOut):
    try:
        store = db.scalar(select(Store).where(Store.contact_person_id == user.id))
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )
        return store
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidates for store", "err_stack": str(e)},
        )


def update_store_details(store_id: str, payload: dict, db: Session):
    """
    Update existing store details.
    Ignores updates to immutable fields (like store_id).
    """

    from models.stores import Store  # local import to avoid circular deps

    store = db.get(Store, store_id)
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found",
        )

    restricted_fields = ["id"]
    payload = {k: v for k, v in payload.items() if k not in restricted_fields}

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No editable fields provided for update.",
        )

    try:
        # Check if updating email → ensure uniqueness
        if "email" in payload:
            existing = db.scalar(select(Store).where(Store.email == payload["email"]))
            if existing and existing.id != store.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Another store already uses this email.",
                )

        for field, value in payload.items():
            if hasattr(store, field):
                setattr(store, field, value)

        db.add(store)
        db.commit()
        db.refresh(store)

        return {
            "store": {
                "id": store.id,
                "store_name": store.store_name,
                "contact_number": store.contact_number,
                "email": store.email,
                "address": store.address,
                "city": store.city,
                "state": store.state,
                "maps_link": store.maps_link,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating store: {str(e)}",
        )
