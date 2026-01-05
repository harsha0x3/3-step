from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from controllers.bulk_upload_controller import (
    generate_bulk_upload_template,
    process_bulk_issuance_upload,
    get_upload_details,
    get_upload_history,
)
import io
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
    get_all_cities,
)
from models.schemas.auth_schemas import RegisterRequest
from typing import Annotated, Literal
from models.schemas.auth_schemas import UserOut

from services.auth.deps import get_current_user

router = APIRouter(prefix="/stores", tags=["Stores"])


# ✅ Create a new store
@router.post("", status_code=status.HTTP_201_CREATED)
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


@router.get("", status_code=status.HTTP_200_OK)
async def list_stores(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_by: Annotated[
        Literal["city", "name"] | None,
        Query(title="Search stores By"),
    ] = None,
    search_term: Annotated[str | None, Query(title="Search stores Term")] = None,
    sort_by: Annotated[
        Literal["created_at", "updated_at", "name", "city"],
        Query(title="Sort stores by"),
    ] = "created_at",
    sort_order: Annotated[
        Literal["asc", "desc"], Query(title="Order of sorting")
    ] = "desc",
    page: Annotated[int, Query(title="Page number")] = 1,
    page_size: Annotated[int, Query(title="Items per page")] = 15,
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
    params = StoreSearchParams(
        search_by=search_by,
        search_term=search_term,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    result = await get_all_stores(db, params)
    return {
        "msg": "Stores fetched",
        "data": {
            "stores": result.get("stores", []),
            "count": result.get("total_count", 0),
            "total_stock": result.get("total_stock"),
            "cities": result.get("cities", []),
        },
    }


@router.get("/cities", status_code=status.HTTP_200_OK)
def get_cities(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    data = get_all_cities(db)
    return {"msg": "", "data": data}


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


@router.post("/upload/offline/issuance", status_code=status.HTTP_200_OK)
async def bulk_upload_issuance(
    file: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """Bulk upload laptop issuance data (CSV/Excel)"""

    if current_user.role != "store_agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only store agents can bulk upload",
        )

    store = get_store_of_user(db, current_user)
    return await process_bulk_issuance_upload(file, store.id, db, store_name=store.name)


@router.get("/offline/history")
def get_upload_history_endpoint(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    limit: int = 20,
    store_id: Annotated[str | None, Query(...)] = None,
):
    """
    Get upload history for the current store.
    Returns list of past uploads with summary statistics.
    """
    if current_user.role not in ["super_admin", "admin"]:
        store = get_store_of_user(db=db, user=current_user)
        store_id = store.id
    elif current_user.role in ["super_admin", "admin"]:
        if not store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store ID is not provided",
            )
        store_id = store_id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to get the data.",
        )
    history = get_upload_history(store_id=store_id, db=db, limit=limit)

    return {"msg": "Upload history retrieved successfully", "data": history}


@router.get("/offline/report-details/{upload_id}")
def get_upload_details_endpoint(
    upload_id: str,
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    store_id: Annotated[str | None, Query(...)] = None,
):
    """
    Get detailed results of a specific upload including all errors.
    """
    if current_user.role not in ["super_admin", "admin"]:
        store = get_store_of_user(db=db, user=current_user)
        store_id = store.id
    elif current_user.role in ["super_admin", "admin"]:
        if not store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store ID is not provided",
            )
        store_id = store_id
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to get the data.",
        )
    details = get_upload_details(
        upload_id=upload_id, db=db, store_id=store_id, user_role=current_user.role
    )

    return {"msg": "Upload details retrieved successfully", "data": details}


@router.get("/download/upload-template", status_code=status.HTTP_200_OK)
async def download_bulk_upload_template(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """Download CSV template for bulk upload"""

    if current_user.role != "store_agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only store agents can download template",
        )

    store = get_store_of_user(db, current_user)
    df = generate_bulk_upload_template(store.id, db)

    # Convert to CSV
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode()),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=bulk_upload_template_{store.id}.csv"
        },
    )
