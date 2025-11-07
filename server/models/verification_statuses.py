from db.base import Base
from sqlalchemy import ForeignKey, Boolean, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone


class VerificationStatus(Base):
    __tablename__ = "verification_statuses"

    candidate_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("candidates.id"),
        primary_key=True,
        nullable=False,
    )
    is_otp_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_facial_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    is_coupon_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )
    candidate = relationship("Candidate", back_populates="verification_status")
