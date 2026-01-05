from pydantic import BaseModel, ConfigDict


class NewRegionSchema(BaseModel):
    name: str


class RegionOutSchema(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class RegionAssociationSchema(BaseModel):
    user_id: str
    region_id: int

    model_config = ConfigDict(from_attributes=True)
