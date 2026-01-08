# models\cities.py

from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class City(Base, BaseMixin):
    __tablename__ = "cities"
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    stores = relationship(
        "Store", secondary="store_city_associations", back_populates="city"
    )


class StoreCityAssociation(Base):
    __tablename__ = "store_city_associations"
    store_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("stores.id", ondelete="cascade", onupdate="cascade"),
    )
    city_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("cities.id", ondelete="cascade", onupdate="cascade"),
    )

    __table_args__ = (PrimaryKeyConstraint("store_id", "city_id"),)
