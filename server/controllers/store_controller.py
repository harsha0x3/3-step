from models.schemas.store_schemas import (
    AddNewStore,
    StoreSearchParams,
    StoreItemWithUser,
    StoreItemOut,
    UpdateStorePayload,
    CityOut,
)
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, func, and_, asc, desc
from models import IssuedStatus
from models.stores import Store
from models.users import User
from models import Candidate, StoreCityAssociation, City
from models.schemas.auth_schemas import UserOut, RegisterRequest
from utils.log_config import logger

MAX_RETRIES = 3


def add_new_store(payload: AddNewStore, db: Session):
    try:
        new_store = Store(
            id=payload.id,
            name=payload.name,
            count=payload.count,
            address=payload.address,
            email=payload.email,
            mobile_number=payload.mobile_number,
        )

        db.add(new_store)
        db.commit()
        db.refresh(new_store)

        for city_id in payload.city_ids:
            association = StoreCityAssociation(
                store_id=new_store.id,
                city_id=city_id,
            )
            db.add(association)

        return new_store

    except Exception as e:
        logger.error(f"Error adding new store - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error Adding store", "err_stack": str(e)},
        )


async def get_all_stores(db: Session, params: StoreSearchParams):
    try:
        query = select(Store)

        # ✅ SEARCH (same logic as Candidates)
        if params and params.search_by and params.search_term:
            setattr(params, "page", -1)

            if params.search_by.lower() == "city":
                query = (
                    query.join(
                        StoreCityAssociation, Store.id == StoreCityAssociation.store_id
                    )
                    .join(City, City.id == StoreCityAssociation.city_id)
                    .where(City.name.ilike(f"%{params.search_term}%"))
                    .distinct(Store.id)
                )
            elif params.search_by.lower() == "name":
                query = query.where(Store.name.ilike(f"%{params.search_term}%"))
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid search_by value: {params.search_by}. Must be 'city' or 'name'.",
                )

        # ✅ SORT
        sort_col = getattr(Store, params.sort_by)

        if params.sort_order == "asc":
            sort_col = asc(sort_col)
        else:
            sort_col = desc(sort_col)

        stats_count = db.query(
            func.count(Store.id).label("total_count"),
            func.sum(Store.count).label("total_stock"),
        ).first()

        print("Stats count: ", stats_count)

        # ✅ PAGINATION
        if params.page >= 1:
            query = (
                query.order_by(sort_col)
                .limit(params.page_size)
                .offset(params.page * params.page_size - params.page_size)
            )
        else:
            query = query.order_by(sort_col)

        stores = db.scalars(query).all()

        # ✅ DISTINCT CITIES (unchanged)
        cities = db.scalars(select(City).distinct()).all()

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
                    address=store.address,
                    city=store.city,
                    mobile_number=store.mobile_number,
                    count=store.count,
                    email=store.email,
                    store_agents=store_agents,
                    total_assigned_candidates=total_assigned_candidates,
                    total_laptops_issued=total_laptops_issued,
                )
            )

        return {
            "stores": result,
            "cities": cities,
            "total_count": stats_count.total_count if stats_count else 0,
            "total_stock": int(stats_count.total_stock) if stats_count else 0,
        }

    except Exception as e:
        logger.error(f"Error in getting all stores - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Error retrieving stores", "err_stack": str(e)},
        )


def get_all_cities(db: Session):
    try:
        cities = db.scalars(select(City).order_by(asc(City.name))).all()
        result = [CityOut.model_validate(city) for city in cities]
        return result
    except Exception as e:
        logger.error(f"Error retrieving cities - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving cities",
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
        logger.error("Error in getting store of user")
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
                if field == "id":
                    store_agent = db.scalar(
                        select(User).where(User.store_id == store_id)
                    )
                    if store_agent:
                        store_agent.store_id = payload.id if payload.id else store.id
                        db.add(store_agent)
                setattr(store, field, value)

            elif field == "city_ids" and payload.city_ids:
                for city_id in payload.city_ids:
                    existing = db.scalar(
                        select(StoreCityAssociation).where(
                            and_(
                                StoreCityAssociation.store_id == store.id,
                                StoreCityAssociation.city_id == city_id,
                            )
                        )
                    )
                    if existing:
                        continue
                    else:
                        new_association = StoreCityAssociation(
                            store_id=store.id, city_id=city_id
                        )
                        db.add(new_association)

        db.add(store)
        db.commit()
        db.refresh(store)

        return StoreItemOut.model_validate(store)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in updating store details")
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
            mobile_number=payload.mobile_number,
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
            if ".mobile_number" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="mobile number already exists",
                )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error  adding store agent - {e}")
        print(f"AGENT ADD ERR - {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding a store agent. Try again",
        )
