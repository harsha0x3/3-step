from pydantic import BaseModel, EmailStr
from .auth_schemas import UserOut
from typing import Literal


class AddNewStore(BaseModel):
    store_person_first_name: str | None = None
    store_person_last_name: str | None = None

    store_name: str
    contact_number: str
    email: EmailStr
    address: str


class UpdateStorePayload(BaseModel):
    store_name: str | None = None
    contact_number: str | None = None
    email: EmailStr | None = None
    address: str | None = None


class StoreSearchParams(BaseModel):
    search_by: Literal["id", "store_name"] | None = None
    search_term: str | None = None


class StoreItemWithUser(BaseModel):
    id: str
    store_name: str
    contact_number: str
    email: str
    address: str

    store_person: UserOut | None = None
