from models.schemas.store_schemas import (
    AddNewStore,
    StoreSearchParams,
    StoreItemWithUser,
    StoreItemOut,
    UpdateStorePayload,
)
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, func, and_
from models import IssuedStatus
from models.stores import Store
from models.users import User
from models import Candidate
from models.schemas.auth_schemas import UserOut, RegisterRequest

MAX_RETRIES = 3


def add_new_store(payload: AddNewStore, db: Session):
    try:
        new_store = Store(**payload.model_dump(exclude_none=True))
        db.add(new_store)
        db.commit()
        db.refresh(new_store)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error Adding store", "err_stack": str(e)},
        )


async def get_all_stores(db: Session, params: StoreSearchParams | None = None):
    try:
        query = select(Store)

        if params and params.search_by and params.search_term:
            if params.search_by.lower() == "city":
                query = query.where(Store.city.ilike(f"%{params.search_term}%"))
            elif params.search_by.lower() == "name":
                query = query.where(Store.name.ilike(f"%{params.search_term}%"))
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid search_by value: {params.search_by}. Must be 'city' or 'name'.",
                )

        stores = db.scalars(query).all()
        cities = db.scalars(
            select(Store.city)
            .distinct()
            .where(Store.city.is_not(None))
            .order_by(Store.city.asc())
        ).all()
        result = []
        for store in stores:
            store_agents = []
            total_assigned_candidates = db.scalar(
                select(func.count(Candidate.id)).where(Candidate.store_id == store.id)
            )

            total_laptops_issued = db.scalar(
                select(func.count(IssuedStatus.candidate_id))
                .select_from(Candidate)
                .join(IssuedStatus, IssuedStatus.candidate_id == Candidate.id)
                .where(
                    and_(
                        Candidate.store_id == store.id,
                        IssuedStatus.issued_status == "issued",
                    )
                )
            )

            if store.store_agents:
                for agent in store.store_agents:
                    store_agents.append(UserOut.model_validate(agent))
            result.append(
                StoreItemWithUser(
                    id=store.id,
                    name=store.name,
                    city=store.city,
                    address=store.address,
                    mobile_number=store.mobile_number,
                    email=store.email,
                    store_agents=store_agents,
                    total_assigned_candidates=total_assigned_candidates,
                    total_laptops_issued=total_laptops_issued,
                )
            )

        return {"stores": result, "cities": cities}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error retrieving stores", "err_stack": str(e)},
        )


def get_store_of_user(db: Session, user: UserOut):
    try:
        store_id = user.store_id
        store = db.get(Store, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Store not found"
            )
        return StoreItemOut.model_validate(store)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error getting candidates for store", "err_stack": str(e)},
        )


def update_store_details(store_id: str, payload: UpdateStorePayload, db: Session):
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

    try:
        for field, value in payload.model_dump(
            exclude_none=True, exclude_unset=True
        ).items():
            if hasattr(store, field):
                setattr(store, field, value)

        db.add(store)
        db.commit()
        db.refresh(store)

        return StoreItemOut.model_validate(store)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating store: {str(e)}",
        )


def add_store_agent(store_id: str, payload: RegisterRequest, db: Session):
    try:
        store = db.get(Store, store_id)
        if not store:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Store not found",
            )
        new_store_agent = User(
            username=payload.username,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
        )
        new_store_agent.set_password(payload.password)
        db.add(new_store_agent)
        db.commit()
        db.refresh(new_store_agent)

        return UserOut.model_validate(new_store_agent)

    except IntegrityError as e:
        db.rollback()
        error_message = str(e.orig)
        if "Duplicate entry" in error_message:
            if ".email" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email address already exists",
                )
            if ".username" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="username already exists",
                )

    except HTTPException:
        raise
    except Exception as e:
        print(f"AGENT ADD ERR - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding a store agent. Try again",
        )
