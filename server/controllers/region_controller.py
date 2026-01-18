from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from models import Region
from models.schemas.region_schemas import RegionOutSchema


def create_new_region(db: Session, name: str) -> RegionOutSchema:
    try:
        new_region = Region(name=name)
        db.add(new_region)
        db.commit()
        db.refresh(new_region)
        return RegionOutSchema.model_validate(new_region)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create region.",
        )


def get_all_regions(db: Session, name: str | None):
    try:
        stmt = select(Region)
        if name:
            stmt = stmt.where(Region.name.ilike(f"%{name}%"))
        regions = db.scalars(stmt).all()

        return [RegionOutSchema.model_validate(region) for region in regions]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch regions.",
        )
