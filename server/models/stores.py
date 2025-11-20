from db.base import Base, BaseMixin
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Store(Base, BaseMixin):
    __tablename__ = "stores"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(600), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)

    mobile_number: Mapped[str] = mapped_column(String(15), nullable=True)
    email: Mapped[str] = mapped_column(String(72), nullable=True)

    store_agents = relationship("User", back_populates="store")
    candidates = relationship("Candidate", back_populates="store")

    __table_args__ = (
        UniqueConstraint("name", "address", name="uq_stores_name_address"),
    )

    def __repr__(self):
        return f"<Store(id={self.id}, name='{self.name}', city='{self.city}')>"
