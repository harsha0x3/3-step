from pydantic import BaseModel, ConfigDict
from .auth_schemas import UserOut
from typing import Literal


class AddNewStore(BaseModel):
    name: str
    city: str
    address: str

    email: str | None = None
    mobile_number: str | None = None


class UpdateStorePayload(BaseModel):
    name: str | None = None
    city: str | None = None
    address: str | None = None

    email: str | None = None
    mobile_number: str | None = None


class StoreSearchParams(BaseModel):
    search_by: Literal["city", "name"] | None = None
    search_term: str | None = None


class StoreItemOut(BaseModel):
    id: str
    name: str
    city: str
    address: str

    email: str | None = None
    mobile_number: str | None = None

    model_config = ConfigDict(from_attributes=True)


class StoreItemWithUser(StoreItemOut, BaseModel):
    store_agents: list[UserOut] | None = None
    total_assigned_candidates: int | None = None
    total_laptops_issued: int | None = None
