import pandas as pd
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import select
from models.candidates import Candidate
from models.issued_statuses import IssuedStatus
from datetime import datetime, timezone
from typing import Any
import io


async def process_bulk_issuance_upload(
    file: UploadFile, store_id: str, db: Session
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
        contents = await file.read()

        # Parse based on file type
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Validate required columns
        required_columns = ["beneficiary_employee_id", "laptop_serial"]
        missing_columns = [col for col in required_columns if col not in df.columns]

        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}",
            )

        # Clean data
        df = df.dropna(subset=required_columns)
        df["beneficiary_employee_id"] = (
            df["beneficiary_employee_id"].astype(str).str.strip()
        )
        df["laptop_serial"] = df["laptop_serial"].astype(str).str.strip()

        # Process each row
        results = {
            "total_rows": len(df),
            "successful": 0,
            "failed": 0,
            "errors": [],
        }

        for idx, row in df.iterrows():
            try:
                beneficiary_employee_id = row["beneficiary_employee_id"]
                laptop_serial = row["laptop_serial"]

                # Get candidate
                candidate = db.scalar(
                    select(Candidate).where(Candidate.id == beneficiary_employee_id)
                )

                if not candidate:
                    results["errors"].append(
                        {
                            "row": idx + 2,  # +2 for header and 0-indexing
                            "beneficiary_employee_id": beneficiary_employee_id,
                            "error": "Candidate not found",
                        }
                    )
                    results["failed"] += 1
                    continue

                # Check if candidate belongs to this store
                if candidate.store_id != store_id:
                    results["errors"].append(
                        {
                            "row": idx + 2,
                            "beneficiary_employee_id": beneficiary_employee_id,
                            "error": "Candidate not assigned to this store",
                        }
                    )
                    results["failed"] += 1
                    continue

                # Check if candidate is verified
                if not candidate.is_candidate_verified:
                    results["errors"].append(
                        {
                            "row": idx + 2,
                            "beneficiary_employee_id": beneficiary_employee_id,
                            "error": "Candidate not verified yet",
                        }
                    )
                    results["failed"] += 1
                    continue

                # Check if already issued
                existing_issuance = db.scalar(
                    select(IssuedStatus).where(
                        IssuedStatus.candidate_id == candidate.id
                    )
                )

                if existing_issuance and existing_issuance.issued_status == "issued":
                    results["errors"].append(
                        {
                            "row": idx + 2,
                            "beneficiary_employee_id": beneficiary_employee_id,
                            "error": "Laptop already issued to this candidate",
                        }
                    )
                    results["failed"] += 1
                    continue

                # Create or update issuance record
                if not existing_issuance:
                    issuance = IssuedStatus(
                        candidate_id=candidate.id,
                        issued_status="issued",
                        issued_laptop_serial=laptop_serial,
                        issued_at=datetime.now(timezone.utc),
                    )
                    db.add(issuance)
                else:
                    existing_issuance.issued_status = "issued"
                    existing_issuance.issued_laptop_serial = laptop_serial
                    existing_issuance.issued_at = datetime.now(timezone.utc)
                    db.add(existing_issuance)

                results["successful"] += 1

            except Exception as e:
                results["errors"].append(
                    {
                        "row": idx + 2,
                        "beneficiary_employee_id": row.get(
                            "beneficiary_employee_id", "N/A"
                        ),
                        "error": str(e),
                    }
                )
                results["failed"] += 1

        # Commit all successful transactions
        db.commit()

        return {"msg": "Bulk upload processed", "data": results}

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
                Candidate.store_id == store_id,
                Candidate.is_candidate_verified,
                IssuedStatus.issued_status != "issued",
            )
        ).all()

        # Create DataFrame
        df = pd.DataFrame(
            [
                {
                    "beneficiary_employee_id": c.id,
                    "full_name": c.full_name,
                    "mobile_number": c.mobile_number,
                    "coupon_code": c.coupon_code,
                    "laptop_serial": "",  # To be filled by store agent
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
