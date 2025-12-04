import pandas as pd
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from models.candidates import Candidate
from models.issued_statuses import IssuedStatus
from models import BulkUploadError, BulkUploadResult
from datetime import datetime, timezone
from typing import Any
import io
from utils.helpers import save_offline_uploaded_file


async def process_bulk_issuance_upload(
    file: UploadFile, store_id: str, db: Session, store_name: str
) -> dict[str, Any]:
    """Process bulk laptop issuance CSV/Excel upload"""

    # Validate file type
    if not file.filename or not file.filename.endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and Excel files are supported",
        )

    try:
        # Read file content
        await save_offline_uploaded_file(file=file, store_name=store_name)
        contents = await file.read()

        # Parse based on file type
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Validate required columns
        required_columns = [
            "Beneficiary Employee No",
            "Full Name",
            "Mobile Number",
            "Voucher Code",
            "Laptop Serial",
            "Store Employee Name",
            "Store Employee Mobile",
        ]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}",
            )

        # Clean data
        df = df.dropna(subset=required_columns)
        df["Beneficiary Employee No"] = (
            df["Beneficiary Employee No"].astype(str).str.strip()
        )
        df["Laptop Serial"] = df["Laptop Serial"].astype(str).str.strip()

        bulk_upload = BulkUploadResult(
            store_id=store_id,
            file_path=file.filename,
            total_rows=len(df),
            successful_count=0,
            failed_count=0,
        )
        db.add(bulk_upload)
        db.flush()

        errors_list = []

        # Process each row
        results = {
            "total_rows": len(df),
            "successful": 0,
            "failed": 0,
            "errors": [],
        }

        for idx, row in df.iterrows():
            try:
                coupon_code = row["Voucher Code"]
                laptop_serial = row["Laptop Serial"]

                # Get candidate
                candidate = db.scalar(
                    select(Candidate).where(Candidate.coupon_code == coupon_code)
                )

                if not candidate:
                    error = BulkUploadError(
                        upload_id=bulk_upload.id,
                        row_number=idx + 2,  # +2 for header and 0-indexing
                        beneficiary_employee_id=str(row["Beneficiary Employee No"]),
                        error_message="Beneficiary not found",
                        voucher_code=coupon_code,
                        laptop_serial=laptop_serial,
                    )
                    errors_list.append(error)
                    bulk_upload.failed_count += 1
                    continue

                # Check if candidate belongs to this store
                if candidate.store_id != store_id:
                    error = BulkUploadError(
                        upload_id=bulk_upload.id,
                        row_number=idx + 2,
                        beneficiary_employee_id=candidate.id,
                        error_message="Beneficiary is not assigned to this store",
                        voucher_code=coupon_code,
                        laptop_serial=laptop_serial,
                    )
                    errors_list.append(error)
                    bulk_upload.failed_count += 1
                    continue

                # Check if candidate is verified
                if not candidate.is_candidate_verified:
                    error = BulkUploadError(
                        upload_id=bulk_upload.id,
                        row_number=idx + 2,
                        beneficiary_employee_id=candidate.id,
                        error_message="Beneficiary not verified by HR yet",
                        voucher_code=coupon_code,
                        laptop_serial=laptop_serial,
                    )
                    errors_list.append(error)
                    bulk_upload.failed_count += 1
                    continue

                # Check if already issued
                existing_issuance = db.scalar(
                    select(IssuedStatus).where(
                        and_(
                            IssuedStatus.candidate_id == candidate.id,
                            IssuedStatus.issued_status == "issued",
                        )
                    )
                )

                if existing_issuance and existing_issuance.issued_status == "issued":
                    error = BulkUploadError(
                        upload_id=bulk_upload.id,
                        row_number=idx + 2,
                        beneficiary_employee_id=candidate.id,
                        error_message="Laptop already issued to this beneficiary",
                        voucher_code=coupon_code,
                        laptop_serial=laptop_serial,
                    )
                    errors_list.append(error)
                    bulk_upload.failed_count += 1
                    continue

                # Create or update issuance record
                if not existing_issuance:
                    issuance = IssuedStatus(
                        candidate_id=candidate.id,
                        issued_status="issued",
                        issued_laptop_serial=laptop_serial,
                        issued_at=datetime.now(timezone.utc),
                        is_offline=True,
                    )
                    db.add(issuance)
                else:
                    existing_issuance.issued_status = "issued"
                    existing_issuance.issued_laptop_serial = laptop_serial
                    existing_issuance.issued_at = datetime.now(timezone.utc)
                    existing_issuance.is_offline = True
                    db.add(existing_issuance)

                results["successful"] += 1

            except Exception as e:
                error = BulkUploadError(
                    upload_id=bulk_upload.id,
                    row_number=idx + 2,
                    beneficiary_employee_id=str(
                        row.get("Beneficiary Employee No", "N/A")
                    ),
                    error_message=str(e),
                    voucher_code=row.get("Voucher Code"),
                    laptop_serial=row.get("Laptop Serial"),
                )
                errors_list.append(error)
                bulk_upload.failed_count += 1
        if errors_list:
            db.add_all(errors_list)
        # Commit all successful transactions
        db.commit()
        db.refresh(bulk_upload)

        return {
            "msg": "Bulk upload processed successfully",
            "data": {
                "upload_id": bulk_upload.id,
                "total_rows": bulk_upload.total_rows,
                "successful": bulk_upload.successful_count,
                "failed": bulk_upload.failed_count,
                "uploaded_at": bulk_upload.updated_at.isoformat(),
                "errors": [
                    {
                        "row": err.row_number,
                        "beneficiary_employee_id": err.beneficiary_employee_id,
                        "error": err.error_message,
                    }
                    for err in errors_list
                ],
            },
        }

    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="File is empty"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}",
        )


def get_upload_history(
    store_id: str, db: Session, limit: int = 20
) -> list[dict[str, Any]]:
    """Get upload history for a store"""

    uploads = (
        db.execute(
            select(BulkUploadResult)
            .where(BulkUploadResult.store_id == store_id)
            .order_by(BulkUploadResult.updated_at.desc())
            .limit(limit)
        )
        .scalars()
        .all()
    )

    return [
        {
            "upload_id": upload.id,
            "filename": upload.file_path,
            "total_rows": upload.total_rows,
            "successful": upload.successful_count,
            "failed": upload.failed_count,
            "uploaded_at": upload.updated_at.isoformat(),
        }
        for upload in uploads
    ]


def get_upload_details(
    upload_id: str, db: Session, store_id: str, user_role: str
) -> dict[str, Any]:
    """Get detailed results of a specific upload"""

    upload = db.scalar(select(BulkUploadResult).where(BulkUploadResult.id == upload_id))

    if not upload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Upload record not found"
        )
    if user_role not in ["super_admin", "admin"] and upload.store_id != store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to Upload records",
        )

    errors = (
        db.execute(
            select(BulkUploadError)
            .where(BulkUploadError.upload_id == upload_id)
            .order_by(BulkUploadError.row_number)
        )
        .scalars()
        .all()
    )

    return {
        "upload_id": upload.id,
        "file_path": upload.file_path,
        "store_id": upload.store_id,
        "total_rows": upload.total_rows,
        "successful": upload.successful_count,
        "failed": upload.failed_count,
        "created_at": upload.updated_at.isoformat(),
        "uploaded_at": upload.created_at.isoformat() if upload.created_at else None,
        "errors": [
            {
                "row": err.row_number,
                "beneficiary_employee_id": err.beneficiary_employee_id,
                "error": err.error_message,
                "voucher_code": err.voucher_code,
                "laptop_serial": err.laptop_serial,
            }
            for err in errors
        ],
    }


def generate_bulk_upload_template(store_id: str, db: Session) -> pd.DataFrame:
    """Generate CSV template with pending candidates for a store"""

    try:
        # Get verified candidates from store who haven't received laptops
        candidates = db.execute(
            select(
                Candidate.id,
                Candidate.full_name,
                Candidate.mobile_number,
                Candidate.coupon_code,
            )
            .outerjoin(IssuedStatus, Candidate.id == IssuedStatus.candidate_id)
            .where(
                and_(
                    and_(
                        Candidate.store_id == store_id,
                        Candidate.is_candidate_verified,
                    ),
                    or_(
                        IssuedStatus.issued_status != "issued",
                        IssuedStatus.issued_status.is_(None),
                    ),
                )
            )
        ).all()

        # Create DataFrame
        df = pd.DataFrame(
            [
                {
                    "Beneficiary Employee No": c.id,
                    "Full Name": c.full_name,
                    "Mobile Number": c.mobile_number,
                    "Voucher Code": c.coupon_code,
                    "Laptop Serial": "",
                    "Store Employee Name": "",
                    "Store Employee Mobile": "",
                }
                for c in candidates
            ]
        )

        return df

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating template: {str(e)}",
        )
