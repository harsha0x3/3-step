from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import text
import pandas as pd
from typing import Annotated
from sqlalchemy.orm import Session
from db.connection import get_db_conn
from models.schemas.auth_schemas import UserOut
from services.auth.deps import get_current_user
import os
from datetime import datetime
from controllers.dashboard_controller import (
    get_admin_dashboard_stats,
    get_store_agent_dashboard_stats,
    get_registration_officer_dashboard_stats,
    get_laptop_issuance_stats_of_all,
    get_registration_office_locations,
)

from controllers.store_controller import get_store_of_user

BASE_SERVER_DIR = os.getenv("BASE_SERVER_DIR")
BASE_CSV_UPLOAD_DIR = os.path.join("downloads")
os.makedirs(BASE_CSV_UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ✅ Get all candidates (with optional search)
@router.get("/download/candidates", status_code=status.HTTP_200_OK)
async def download_candidates_data(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role != "admin" and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Not authorised to view all candidates with role - {current_user.role}",
        )

    sql_query = text("""
SELECT
    c.id AS employee_id,
    c.full_name,
    c.mobile_number,
    c.coupon_code AS voucher_code,
    c.dob,
    c.state,
    c.city,
    c.division,
    c.store_id,
    c.aadhar_number,
    s.name AS store_name,
    s.city AS store_city,
    s.address AS store_address,
    s.email AS store_email,
    s.mobile_number AS store_mobile
FROM candidates c
LEFT JOIN stores s ON c.store_id = s.id
""")

    with db.connection() as conn:
        df = pd.read_sql(sql_query, conn)

    now_time = datetime.now()
    now_str = now_time.strftime("%Y%m%d-%H:%M")
    filename = f"employees_download_{now_str}.xlsx"
    filepath = os.path.join(BASE_CSV_UPLOAD_DIR, filename)
    df.to_excel(filepath, index=False)

    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="candidates.xlsx",
    )


@router.get("/stats/brief")
async def get_brief_stats(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    try:
        result = get_laptop_issuance_stats_of_all(db)
        return {"data": result, "msg": "Fetched the stats successfully"}
    except Exception as e:
        print(f"IN DASHROUTE {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching stats",
        )


@router.get("/stats/role-based", status_code=status.HTTP_200_OK)
async def get_role_based_stats(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    """Get dashboard statistics based on user role"""

    if current_user.role in ["admin", "super_admin"]:
        stats = get_admin_dashboard_stats(db)
    elif current_user.role == "store_agent":
        store = get_store_of_user(db, current_user)
        stats = get_store_agent_dashboard_stats(db, store.id)
    elif current_user.role == "registration_officer":
        stats = get_registration_officer_dashboard_stats(db, current_user)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return {"msg": "Dashboard statistics retrieved", "data": stats}


@router.get("/registration_office-locations")
async def list_registration_office_locations(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    if current_user.role not in ["admin", "super_admin", "registration_officer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )
    return get_registration_office_locations(db)
