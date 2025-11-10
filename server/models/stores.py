from db.base import Base, BaseMixin
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Store(Base, BaseMixin):
    __tablename__ = "stores"

    store_name: Mapped[str] = mapped_column(String(512), nullable=False)
    contact_person_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("users.id"), nullable=False
    )
    contact_number: Mapped[str] = mapped_column(String(36), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=True, unique=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)

    store_person = relationship("User", back_populates="store")
    candidates = relationship("Candidate", back_populates="store")

    def __repr__(self):
        return f"<Store(id={self.id}, user_id='{self.contact_person_id}', email='{self.email}', store_name='{self.store_name}')>"
