from db.base import Base, BaseMixin
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Store(Base, BaseMixin):
    __tablename__ = "stores"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=True)
    email: Mapped[str] = mapped_column(String(72), nullable=True)

    address: Mapped[str] = mapped_column(String(600), nullable=True)

    store_agents = relationship("User", back_populates="store")
    candidates = relationship("Candidate", back_populates="store")

    city = relationship(
        "City", secondary="store_city_associations", back_populates="stores"
    )

    def __repr__(self):
        return f"<Store(id={self.id}, name='{self.name}', city='{self.city}')>"
