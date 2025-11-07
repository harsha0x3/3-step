from db.base import Base
from sqlalchemy import ForeignKey, Boolean, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone


class Coupon(Base):
    __tablename__ = "coupons"

    candidate_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("candidates.id"),
        primary_key=True,
        nullable=False,
    )
    coupon_code: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    coupon_photo: Mapped[str] = mapped_column(Text, nullable=True)

    candidate = relationship("Candidate", back_populates="coupon")
