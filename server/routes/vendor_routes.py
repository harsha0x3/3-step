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
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        and current_user.role != "registration_officer"
    ):
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
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        and current_user.role != "registration_officer"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )
    result = vendors_controller.get_all_vendors(db=db, search_term=search_term)
    return {"msg": "Vendors fetched", "data": result}


@router.patch("/{vendor_id}")
async def update_vendor(
    payload: Annotated[vendor_schemas.UpdateVendor, ""],
    vendor_id: Annotated[str, Path(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update vendors data",
        )
    return await vendors_controller.update_vendor(
        payload=payload, vendor_id=vendor_id, db=db
    )


@router.post("/{vendor_id}", status_code=status.HTTP_201_CREATED)
async def create_vendor_spoc(
    vendor_id: Annotated[str, Path(...)],
    full_name: Annotated[str, Form(...)],
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    photo: Annotated[UploadFile | None, File(title="vendor spoc photo")] = None,
    email: Annotated[str | None, Form(...)] = None,
    mobile_number: Annotated[str | None, Form(...)] = None,
):
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        and current_user.role != "registration_officer"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not create a vendor contact person",
        )
    payload = vendor_schemas.NewVendorSpoc(
        vendor_id=vendor_id,
        full_name=full_name,
        email=email,
        mobile_number=mobile_number,
    )
    result = await vendors_controller.add_new_vendor_spoc(
        payload=payload, db=db, photo=photo
    )
    return {"msg": "Vendor Spoc created", "data": result}


@router.patch("/spoc/{vendor_spoc_id}")
async def update_vendor_spoc(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    vendor_spoc_id: Annotated[str, Path(...)],
    vendor_id: Annotated[str | None, Form(...)] = None,
    full_name: Annotated[str | None, Form(...)] = None,
    photo: Annotated[UploadFile | None, File(title="vendor spoc photo")] = None,
    email: Annotated[str | None, Form(...)] = None,
    mobile_number: Annotated[str | None, Form(...)] = None,
):
    if current_user.role not in ["super_admin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to update vendors data",
        )
    payload = vendor_schemas.UpdateVendorSpoc(
        vendor_id=vendor_id,
        full_name=full_name,
        mobile_number=mobile_number,
        email=email,
    )
    result = await vendors_controller.update_vendor_spoc(
        payload=payload, vendor_spoc_id=vendor_spoc_id, db=db, photo=photo
    )
    return {"msg": "Vendor Spoc Updated Successfully", "data": result}


@router.get("/spoc", status_code=status.HTTP_200_OK)
async def get_all_vendors_spoc(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    search_term: Annotated[str, Query(...)],
):
    if (
        current_user.role != "admin"
        and current_user.role != "super_admin"
        and current_user.role != "registration_officer"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorised to view all candidates",
        )
    result = vendors_controller.get_all_vendor_spoc(db=db, search_term=search_term)
    return {"msg": "Vendors spoc fetched", "data": result}
