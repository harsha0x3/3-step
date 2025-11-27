from sqlalchemy.orm import Session
from sqlalchemy import select
from models.schemas import vendor_schemas
from models.vendors import Vendor, VendorSpoc
from fastapi import HTTPException, status, UploadFile
from utils.helpers import save_vendor_spoc_img, get_relative_upload_path


def add_vendor(payload: vendor_schemas.NewVendor, db: Session):
    try:
        new_vendor = Vendor(**payload.model_dump())
        db.add(new_vendor)
        db.commit()
        db.refresh(new_vendor)
        return new_vendor
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add the vendor",
        )


def get_all_vendors(db: Session, search_term: str | None = None):
    try:
        query = select(Vendor)

        if search_term and search_term.strip != "":
            query = query.where(Vendor.vendor_name.ilike(f"%{search_term}%"))
        vendors = db.scalars(query).all()
        result = []
        for vendor in vendors:
            data = vendor_schemas.VendorItem.model_validate(vendor)
            result.append(data)
        return result
    except Exception as e:
        print("Error getting vendors", e)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get vendors",
        )


async def add_new_vendor_spoc(
    payload: vendor_schemas.NewVendorSpoc, photo: UploadFile, db: Session
):
    try:
        vendor = db.get(Vendor, payload.vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found"
            )
        photo_url = await save_vendor_spoc_img(photo=photo)
        new_vendor_spoc = VendorSpoc(
            vendor_id=vendor.id,
            full_name=payload.full_name,
            mobile_number=payload.mobile_number,
            email=payload.email,
            photo=photo_url,
        )
        db.add(new_vendor_spoc)
        db.commit()
        db.refresh(new_vendor_spoc)
        return new_vendor_spoc

    except HTTPException:
        raise

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add vendor spoc",
        )


def get_all_vendor_spoc(db: Session, search_term: str | None = None):
    try:
        query = select(VendorSpoc)

        if search_term and search_term.strip() != "":
            query = query.where(VendorSpoc.full_name.ilike(f"%{search_term}%"))
        vendor_spocs = db.scalars(query).all()
        result = []
        for vendor_spoc in vendor_spocs:
            data = vendor_schemas.VendorSpocItem(
                id=vendor_spoc.id,
                vendor_id=vendor_spoc.vendor_id,
                full_name=vendor_spoc.full_name,
                mobile_number=vendor_spoc.mobile_number,
                email=vendor_spoc.email,
                photo=get_relative_upload_path(vendor_spoc.photo),
                vendor=vendor_spoc.vendor,
            )
            result.append(data)
        return result
    except Exception as e:
        print("Error getting vendors spoc", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get vendors",
        )


async def update_vendor_spoc(
    payload: vendor_schemas.UpdateVendorSpoc,
    vendor_spoc_id: str,
    db: Session,
    photo: UploadFile | None = None,
):
    try:
        vendor_spoc = db.get(VendorSpoc, vendor_spoc_id)
        if not vendor_spoc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor Contact Person Not found",
            )
        for key, val in payload.model_dump(
            exclude_none=True, exclude_unset=True
        ).items():
            if hasattr(vendor_spoc, key):
                print(f"Updating key - {key}; val - {val}")
                setattr(vendor_spoc, key, val)
        if photo:
            photo_url = await save_vendor_spoc_img(photo=photo)
            vendor_spoc.photo = photo_url

        db.add(vendor_spoc)
        db.commit()
        db.refresh(vendor_spoc)
        return vendor_spoc

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected Error while updating vendor contact person",
        )


async def update_vendor(
    payload: vendor_schemas.UpdateVendor, vendor_id: str, db: Session
):
    try:
        vendor = db.get(Vendor, vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor Contact Person Not found",
            )
        for key, val in payload.model_dump(
            exclude_none=True, exclude_unset=True
        ).items():
            if hasattr(vendor, key):
                setattr(vendor, key, val)

        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        return vendor
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unexpected Error while updating vendor contact person",
        )
