from pydantic import BaseModel, ConfigDict
from .auth_schemas import UserOut
from typing import Literal


class CityOut(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class AddNewStore(BaseModel):
    id: str
    name: str
    city_ids: list[str]
    count: int
    address: str | None = None

    email: str | None = None
    mobile_number: str | None = None


class UpdateStorePayload(BaseModel):
    id: str | None = None
    name: str | None = None
    city_ids: list[str] | None = None
    count: int | None = None

    address: str | None = None

    email: str | None = None
    mobile_number: str | None = None


class StoreSearchParams(BaseModel):
    search_by: Literal["city", "name"] | None = None
    search_term: str | None = None
    page: int = 1
    page_size: int = 15
    sort_by: Literal["created_at", "updated_at", "name", "city"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"


class StoreItemOut(BaseModel):
    id: str
    name: str
    city: list[CityOut] | None = None
    count: int
    address: str | None = None

    email: str | None = None
    mobile_number: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StoreItemWithUser(StoreItemOut, BaseModel):
    store_agents: list[UserOut] | None = None
    total_assigned_candidates: int | None = None
    total_laptops_issued: int | None = None
