from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from db.connection import get_db_conn
from models.schemas.region_schemas import RegionOutSchema, NewRegionSchema
from controllers.region_controller import create_new_region, get_all_regions
from typing import Annotated
from services.auth.deps import get_current_user
from models.schemas.auth_schemas import UserOut

router = APIRouter(
    prefix="/regions",
    tags=["Regions"],
)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_region(
    payload: NewRegionSchema,
    db: Session = Depends(get_db_conn),
):
    """
    Create a new region.
    """
    return create_new_region(db=db, name=payload.name)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
)
def list_regions(
    db: Annotated[Session, Depends(get_db_conn)],
    current_user: Annotated[UserOut, Depends(get_current_user)],
    name: Annotated[str | None, Query(...)] = None,
):
    """
    Get all regions.
    """
    data = get_all_regions(db=db, name=name)
    return {"msg": "", "data": data}
