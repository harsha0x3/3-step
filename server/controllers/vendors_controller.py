from sqlalchemy.orm import Session
from sqlalchemy import select, func, asc, desc
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


def get_all_vendors(db: Session, params: vendor_schemas.VendorSearchParams):
    try:
        stmt = select(Vendor)

        # Count query
        count_stmt = select(func.count(Vendor.id))
        total_count = db.scalar(count_stmt)

        # Search
        if params.search_by and params.search_term and params.search_term != "null":
            setattr(params, "page", -1)  # disable pagination for search
            column_attr = getattr(Vendor, params.search_by)
            stmt = stmt.where(column_attr.ilike(f"%{params.search_term}%"))

        # Sorting
        sort_col = getattr(Vendor, params.sort_by)
        sort_col = asc(sort_col) if params.sort_order == "asc" else desc(sort_col)

        # Pagination
        if params.page >= 1:
            vendors = db.scalars(
                stmt.order_by(sort_col)
                .limit(params.page_size)
                .offset((params.page - 1) * params.page_size)
            ).all()
        else:
            vendors = db.scalars(stmt.order_by(sort_col)).all()

        result = [vendor_schemas.VendorItem.model_validate(v) for v in vendors]

        return {
            "msg": "Vendors fetched successfully",
            "data": {
                "vendors": result,
                "total_count": total_count,
                "count": len(result),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Failed to get vendors", "err_stack": str(e)},
        )


async def add_new_vendor_spoc(
    payload: vendor_schemas.NewVendorSpoc, photo: UploadFile | None, db: Session
):
    try:
        vendor = db.get(Vendor, payload.vendor_id)
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found"
            )
        photo_url = await save_vendor_spoc_img(photo=photo) if photo else None
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


def get_all_vendor_spoc(db: Session, params: vendor_schemas.VendorSpocSearchParams):
    try:
        stmt = select(VendorSpoc).join(Vendor)

        # ---- Count query ----
        count_stmt = select(func.count(VendorSpoc.id)).join(Vendor)
        total_count = db.scalar(count_stmt)

        # ---- Vendor filter ----
        if params.vendor_id and params.vendor_id != "null":
            stmt = stmt.where(VendorSpoc.vendor_id == params.vendor_id)

        # ---- Search logic ----
        if params.search_by and params.search_term and params.search_term != "null":
            setattr(params, "page", -1)

            if params.search_by == "vendor_name" and params.search_term:
                stmt = stmt.where(Vendor.vendor_name.ilike(f"%{params.search_term}%"))
            else:
                column_attr = getattr(VendorSpoc, params.search_by)
                stmt = stmt.where(column_attr.ilike(f"%{params.search_term}%"))

        # ---- Sorting ----
        sort_col = getattr(VendorSpoc, params.sort_by)
        sort_col = asc(sort_col) if params.sort_order == "asc" else desc(sort_col)

        # ---- Pagination ----
        if params.page >= 1:
            vendor_spocs = db.scalars(
                stmt.order_by(sort_col)
                .limit(params.page_size)
                .offset((params.page - 1) * params.page_size)
            ).all()
        else:
            vendor_spocs = db.scalars(stmt.order_by(sort_col)).all()

        # ---- Response mapping ----
        result = []
        for v in vendor_spocs:
            result.append(
                vendor_schemas.VendorSpocItem(
                    id=v.id,
                    vendor_id=v.vendor_id,
                    full_name=v.full_name,
                    mobile_number=v.mobile_number,
                    email=v.email,
                    photo=get_relative_upload_path(v.photo) if v.photo else None,
                    vendor=v.vendor,
                )
            )

        return {
            "msg": "Vendor SPOCs fetched successfully",
            "data": {
                "vendor_spocs": result,
                "total_count": total_count,
                "count": len(result),
            },
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"msg": "Failed to get vendor spocs", "err_stack": str(e)},
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
