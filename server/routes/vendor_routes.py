from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    Form,
    status,
    HTTPException,
    Path,
    Query,
)
from sqlalchemy.orm import Session
from typing import Annotated
from db.connection import get_db_conn
from models.schemas import vendor_schemas
from models.schemas.auth_schemas import UserOut
from services.auth.deps import get_current_user
from controllers import vendors_controller

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_vendor(
    payload: Annotated[vendor_schemas.NewVendor, ""],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin" and current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )

    result = vendors_controller.add_vendor(payload=payload, db=db)
    return {"msg": "Vendor created", "data": result}


@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_vendors(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_term: Annotated[str, Query(...)],
):
    if current_user.role != "admin" and current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )
    result = vendors_controller.get_all_vendors(db=db, search_term=search_term)
    return {"msg": "Vendors fetched", "data": result}


@router.post("/{vendor_id}", status_code=status.HTTP_201_CREATED)
async def create_vendor_spoc(
    vendor_id: Annotated[str, Path(...)],
    full_name: Annotated[str, Form(...)],
    contact: Annotated[str, Form(...)],
    photo: Annotated[UploadFile, File(title="vendor spoc photo")],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin" and current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )
    payload = vendor_schemas.NewVendorSpoc(
        vendor_id=vendor_id, full_name=full_name, contact=contact
    )
    result = await vendors_controller.add_new_vendor_spoc(
        payload=payload, db=db, photo=photo
    )
    return {"msg": "Vendor Spoc created", "data": result}


@router.get("/spoc", status_code=status.HTTP_200_OK)
async def get_all_vendors_spoc(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_term: Annotated[str, Query(...)],
):
    if current_user.role != "admin" and current_user.role != "verifier":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )
    result = vendors_controller.get_all_vendor_spoc(db=db, search_term=search_term)
    return {"msg": "Vendors spoc fetched", "data": result}
