from db.base import Base
from sqlalchemy import ForeignKey, Boolean, String, DateTime, TIMESTAMP, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone


class VerificationStatus(Base):
    __tablename__ = "verification_statuses"

    candidate_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("candidates.id", onupdate="cascade"),
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
    is_aadhar_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    uploaded_candidate_photo: Mapped[str] = mapped_column(Text, nullable=True)
    entered_aadhar_number: Mapped[str] = mapped_column(String(20), nullable=True)

    overriding_user: Mapped[str] = mapped_column(String(150), nullable=True)
    overriding_reason: Mapped[str] = mapped_column(Text, nullable=True)

    coupon_verified_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)
    otp_verified_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)
    facial_verified_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)
    aadhar_verified_at: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True)

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
