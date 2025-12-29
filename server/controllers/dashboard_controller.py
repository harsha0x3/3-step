from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, case, not_
from models import Candidate, User, VerificationStatus, Store
from models.issued_statuses import IssuedStatus
from models import UpgradeRequest
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from typing import Any


def get_admin_dashboard_stats(db: Session) -> dict[str, Any]:
    """Get comprehensive dashboard statistics for admin"""
    try:
        # Total candidates
        total_candidates = db.scalar(select(func.count(Candidate.id)))

        # Verified candidates
        verified_candidates = db.scalar(
            select(func.count(Candidate.id)).where(Candidate.is_candidate_verified)
        )

        # Candidates with laptops issued
        issued_laptops = db.scalar(
            select(func.count(Candidate.id))
            .join(IssuedStatus)
            .where(
                and_(
                    IssuedStatus.issued_status == "issued",
                    IssuedStatus.is_requested_to_upgrade.is_(False),
                )
            )
        )

        upgrade_requests_stats = db.execute(
            select(
                func.count(UpgradeRequest.candidate_id).label("upgrade_requests"),
                func.sum(case((UpgradeRequest.is_accepted, 1), else_=0)).label(
                    "upgrades_completed"
                ),
            )
        ).all()

        # print("UPGRADE STATS", upgrade_requests_stats)

        total_stores = db.scalar(select(func.count(Store.id)))

        # Pending verifications
        pending_verifications = (total_candidates or 0) - (verified_candidates or 0)

        # Store-wise statistics
        store_stats = db.execute(
            select(
                Store.id,
                Store.name,
                Store.city,
                func.count(Candidate.id).label("total_candidates"),
                func.sum(
                    case((IssuedStatus.issued_status == "issued", 1), else_=0)
                ).label("laptops_issued"),
                func.sum(
                    case((not_(VerificationStatus.is_aadhar_verified), 1), else_=0)
                ).label("aadhar_failed"),
                func.sum(
                    case((not_(VerificationStatus.is_facial_verified), 1), else_=0)
                ).label("facial_failed"),
            )
            .outerjoin(Candidate, Store.id == Candidate.store_id)
            .outerjoin(IssuedStatus, Candidate.id == IssuedStatus.candidate_id)
            .outerjoin(
                VerificationStatus, Candidate.id == VerificationStatus.candidate_id
            )
            .group_by(Store.id, Store.name, Store.city)
        ).all()
        # print("store", store_stats)
        return {
            "summary": {
                "total_candidates": total_candidates,
                "verified_candidates": verified_candidates,
                "issued_laptops": issued_laptops,
                "pending_verifications": pending_verifications,
                "verification_rate": round(
                    (verified_candidates / total_candidates * 100)
                    if total_candidates > 0
                    else 0,
                    2,
                ),
                "total_stores": total_stores,
                "issuance_rate": round(
                    (issued_laptops / verified_candidates * 100)
                    if verified_candidates > 0
                    else 0,
                    2,
                ),
            },
            "store_statistics": [
                {
                    "store_id": row.id,
                    "store_name": row.name,
                    "city": row.city,
                    "total_candidates": row.total_candidates or 0,
                    "aadhar_failed": row.aadhar_failed or 0,
                    "facial_failed": row.facial_failed or 0,
                    "laptops_issued": row.laptops_issued or 0,
                }
                for row in store_stats
            ],
            "upgrade_statistics": {
                "upgrade_requests": upgrade_requests_stats[0].upgrade_requests
                if upgrade_requests_stats
                else 0,
                "upgrades_completed": upgrade_requests_stats[0].upgrades_completed
                if upgrade_requests_stats
                else 0,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin dashboard stats: {str(e)}",
        )


def get_store_agent_dashboard_stats(db: Session, store_id: str) -> dict[str, Any]:
    """Get dashboard statistics for store agent"""
    try:
        # Total candidates in this store
        total_candidates = db.scalar(
            select(func.count(Candidate.id)).where(Candidate.store_id == store_id)
        )

        # Verified candidates
        verified_candidates = db.scalar(
            select(func.count(Candidate.id)).where(
                and_(
                    Candidate.store_id == store_id,
                    Candidate.is_candidate_verified,
                )
            )
        )

        # Laptops issued
        issued_laptops = db.scalar(
            select(func.count(Candidate.id))
            .join(IssuedStatus)
            .where(
                and_(
                    Candidate.store_id == store_id,
                    IssuedStatus.issued_status == "issued",
                    IssuedStatus.is_requested_to_upgrade.is_(False),
                )
            )
        )

        upgrade_requests_stats = db.execute(
            select(
                func.sum(case((~UpgradeRequest.is_accepted, 1), else_=0)).label(
                    "upgrade_requests"
                ),
                func.sum(case((UpgradeRequest.is_accepted, 1), else_=0)).label(
                    "upgrades_completed"
                ),
            )
            .join(Candidate, Candidate.id == UpgradeRequest.candidate_id)
            .where(Candidate.store_id == store_id)
        ).all()

        # Recent issuances (last 10)
        recent_issuances = db.execute(
            select(
                Candidate.id,
                Candidate.full_name,
                Candidate.mobile_number,
                IssuedStatus.issued_at,
                IssuedStatus.issued_laptop_serial,
            )
            .join(IssuedStatus)
            .where(
                and_(
                    Candidate.store_id == store_id,
                    IssuedStatus.issued_status == "issued",
                )
            )
            .order_by(IssuedStatus.issued_at.desc())
            .limit(10)
        ).all()

        return {
            "summary": {
                "total_candidates": total_candidates or 0,
                "verified_candidates": verified_candidates or 0,
                "issued_laptops": issued_laptops or 0,
            },
            "recent_issuances": [
                {
                    "candidate_id": row.id,
                    "full_name": row.full_name,
                    "mobile_number": row.mobile_number,
                    "issued_at": row.issued_at.isoformat() if row.issued_at else None,
                    "laptop_serial": row.issued_laptop_serial,
                }
                for row in recent_issuances
            ],
            "upgrade_statistics": {
                "upgrade_requests": upgrade_requests_stats[0].upgrade_requests
                if upgrade_requests_stats
                else 0,
                "upgrades_completed": upgrade_requests_stats[0].upgrades_completed
                if upgrade_requests_stats
                else 0,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching store dashboard stats: {str(e)}",
        )


def get_registration_officer_dashboard_stats(db: Session) -> dict[str, Any]:
    """Get dashboard statistics for registration officer"""
    try:
        # Total candidates
        total_candidates = db.scalar(select(func.count(Candidate.id)))

        # Verified candidates
        verified_candidates = db.scalar(
            select(func.count(Candidate.id)).where(Candidate.is_candidate_verified)
        )

        # Pending verifications
        pending_verifications = total_candidates - (verified_candidates or 0)

        total_stores = db.scalar(select(func.count(Store.id)))

        # Recently verified candidates (last 10)
        recent_verifications = db.execute(
            select(
                Candidate.id,
                Candidate.full_name,
                Candidate.mobile_number,
                Candidate.store_id,
                Store.name.label("store_name"),
                Candidate.updated_at,
            )
            .outerjoin(Store, Candidate.store_id == Store.id)
            .where(Candidate.is_candidate_verified)
            .order_by(Candidate.updated_at.desc())
            .limit(10)
        ).all()

        # Pending candidates (not verified)
        pending_candidates = db.execute(
            select(
                Candidate.id,
                Candidate.full_name,
                Candidate.mobile_number,
                Candidate.store_id,
                Store.name.label("store_name"),
                Candidate.created_at,
            )
            .outerjoin(Store, Candidate.store_id == Store.id)
            .where(Candidate.is_candidate_verified)
            .order_by(Candidate.created_at.asc())
            .limit(20)
        ).all()

        return {
            "summary": {
                "total_candidates": total_candidates or 0,
                "verified_candidates": verified_candidates or 0,
                "pending_verifications": pending_verifications,
                "total_stores": total_stores,
                "completion_rate": round(
                    (verified_candidates / total_candidates * 100)
                    if total_candidates > 0
                    else 0,
                    2,
                ),
            },
            "recent_verifications": [
                {
                    "candidate_id": row.id,
                    "full_name": row.full_name,
                    "mobile_number": row.mobile_number,
                    "store_id": row.store_id,
                    "store_name": row.store_name,
                    "verified_at": row.updated_at.isoformat()
                    if row.updated_at
                    else None,
                }
                for row in recent_verifications
            ],
            "pending_candidates": [
                {
                    "candidate_id": row.id,
                    "full_name": row.full_name,
                    "mobile_number": row.mobile_number,
                    "store_id": row.store_id,
                    "store_name": row.store_name,
                    "created_at": row.created_at.isoformat()
                    if row.created_at
                    else None,
                }
                for row in pending_candidates
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching officer dashboard stats: {str(e)}",
        )


def get_laptop_issuance_stats_of_all(db: Session):
    try:
        count_of_total_candidates = db.scalar(select(func.count(Candidate.id)))

        count_of_verified_candidates = db.scalar(
            select(func.count(Candidate.id)).where(Candidate.is_candidate_verified)
        )

        count_of_candidate_recieved_laptops = db.scalar(
            select(func.count(Candidate.id))
            .join(IssuedStatus)
            .where(IssuedStatus.issued_status == "issued")
        )

        count_of_stores = db.scalar(select(func.count(Store.id)))

        return {
            "count_of_total_candidates": count_of_total_candidates,
            "count_of_verified_candidates": count_of_verified_candidates,
            "count_of_candidate_recieved_laptops": count_of_candidate_recieved_laptops,
            "count_of_stores": count_of_stores,
        }

    except Exception as e:
        print("STATS ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to get the stats",
        )


def get_registration_office_locations(db: Session):
    try:
        locations = db.scalars(
            select(User.location).distinct().where(User.role == "registration_officer")
        ).all()
        return locations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching registration office locations",
        )


# INSERT INTO
# (type, path, id, created_at, updated_at, is_active)
# VALUES
# (
#   'login_sop',
#   'uploads/utilities/Login Procedure.pdf',
#   '2e84a5e2-eca6-45c1-8b23-35917e5cb2fe',
#   '2025-12-26 11:09:02',
#   '2025-12-26 11:09:02',
#   1
# ),
# (
#   'voucher_distribution_sop',
#   'uploads/utilities/Voucher Distribution Module SOP.pdf',
#   '61c7a56d-2fb7-4df1-b753-37e2fc237fb4',
#   '2025-12-26 11:08:23',
#   '2025-12-26 11:08:23',
#   1
# ),
# (
#   'laptop_distribution_sop',
#   'uploads/utilities/Laptop Distribution Process.pdf',
#   'c76881f9-6614-40e5-ac0c-3b38b472fcab',
#   '2025-12-26 11:08:43',
#   '2025-12-26 11:08:43',
#   1
# );
