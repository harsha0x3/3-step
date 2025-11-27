from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from models.schemas.store_schemas import (
    AddNewStore,
    StoreSearchParams,
    UpdateStorePayload,
)
from controllers.store_controller import (
    add_new_store,
    get_all_stores,
    update_store_details,
    get_store_of_user,
    add_store_agent,
)
from models.schemas.auth_schemas import RegisterRequest
from typing import Annotated, Literal
from models.schemas.auth_schemas import UserOut

from services.auth.deps import get_current_user

router = APIRouter(prefix="/stores", tags=["Stores"])


# ✅ Create a new store
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_store(
    payload: AddNewStore,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Create a new store with a unique store_id.
    Retries automatically if ID collision occurs.
    """
    if current_user.role != "admin" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to add store"
        )
    new_store = add_new_store(payload, db)
    return {"message": "Store created successfully", "data": new_store}


@router.get("/", status_code=status.HTTP_200_OK)
async def list_stores(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_by: Annotated[
        Literal["city", "name"] | None,
        Query(title="Search stores By"),
    ] = None,
    search_term: Annotated[str | None, Query(title="Search stores Term")] = None,
):
    """
    Retrieve all stores.
    Optional query parameters:
        - search_by: "store_id" or "name"
        - search_term: partial match text
    """
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        and current_user.role != "registration_officer"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorised to add store"
        )
    params = StoreSearchParams(search_by=search_by, search_term=search_term)
    result = await get_all_stores(db, params)
    return {
        "msg": "Stores fetched",
        "data": {
            "stores": result.get("stores", []),
            "count": len(result.get("stores", [])),
            "cities": result.get("cities", []),
        },
    }


@router.get("/my-store", status_code=status.HTTP_200_OK)
async def get_store_by_user(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    store = get_store_of_user(db=db, user=current_user)
    return {"msg": "Store of the user found", "data": {"store": store}}


@router.patch("/{store_id}", status_code=status.HTTP_200_OK)
async def update_store(
    store_id: str,
    payload: UpdateStorePayload,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Update a store's details.
    Only admin can update stores.
    """
    if current_user.role != "admin" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update store",
        )

    updated_store = update_store_details(store_id, payload, db)
    return {"msg": "Store updated successfully", "data": updated_store}


@router.patch("/{store_id}", status_code=status.HTTP_200_OK)
async def add_new_store_agent(
    store_id: str,
    payload: Annotated[RegisterRequest, "Details of store employee"],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """
    Update a store's details.
    Only admin can update stores.
    """
    if current_user.role != "admin" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update store",
        )

    new_store_agent = add_store_agent(store_id, payload, db)
    return {"msg": "Store updated successfully", "data": new_store_agent}
