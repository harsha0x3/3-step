# models\regions.py
from db.base import Base, BaseMixin
from sqlalchemy import ForeignKey, String, PrimaryKeyConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Region(Base, BaseMixin):
    __tablename__ = "regions"
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    candidates = relationship("Candidate", back_populates="region")

    users = relationship(
        "User",
        secondary="region_user_associations",
        back_populates="regions",
    )


class RegionUserAssociation(Base):
    __tablename__ = "region_user_associations"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="cascade"),
    )

    region_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("regions.id", ondelete="cascade"),
    )

    __table_args__ = (PrimaryKeyConstraint("user_id", "region_id"),)
