from db.base import Base
from sqlalchemy import ForeignKey, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime


class IssuedStatus(Base):
    __tablename__ = "issued_statuses"

    candidate_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("candidates.id"),
        primary_key=True,
        nullable=False,
    )
    issued_status: Mapped[str] = mapped_column(
        String(20), default="not_issued", nullable=False
    )
    issued_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    issued_laptop_serial: Mapped[str] = mapped_column(
        String(128), nullable=True, unique=True
    )

    evidence_photo: Mapped[str] = mapped_column(Text, nullable=True)

    candidate = relationship("Candidate", back_populates="issued_status")
