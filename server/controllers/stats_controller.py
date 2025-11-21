from sqlalchemy import select, func
from models import Candidate, Store, IssuedStatus
from sqlalchemy.orm import Session
from fastapi import HTTPException, status


def get_laptop_issuance_stats_of_all(db: Session):
    try:
        count_of_total_candidates = db.scalar(select(func.count(Candidate.id)))

        count_of_verified_candidates = db.scalar(
            select(func.count(Candidate.id)).where(
                Candidate.is_candidate_verified == True
            )
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
