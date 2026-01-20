from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from models import Region, RegionUserAssociation
from models.schemas.region_schemas import RegionOutSchema
from models.schemas.auth_schemas import UserOut


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


def get_all_regions(db: Session, name: str | None, current_user: UserOut):
    try:
        stmt = select(Region)
        if current_user.role == "registration_officer":
            print("USER ROLE REGISTRATION OFFICER")
            stmt = stmt.join(
                RegionUserAssociation, RegionUserAssociation.region_id == Region.id
            ).where(RegionUserAssociation.user_id == current_user.id)
            print("STMT", stmt)

        if name:
            stmt = stmt.where(Region.name.ilike(f"%{name}%"))
        regions = db.scalars(stmt).all()

        return [RegionOutSchema.model_validate(region) for region in regions]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch regions.",
        )
