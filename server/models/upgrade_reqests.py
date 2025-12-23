from db.base import Base
from sqlalchemy import ForeignKey, String, Integer, Boolean, text, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class UpgradeRequest(Base):
    __tablename__ = "upgrade_requests"

    candidate_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("candidates.id", onupdate="cascade", ondelete="cascade"),
        primary_key=True,
        nullable=False,
    )
    cost_of_upgrade: Mapped[int] = mapped_column(Integer, nullable=False)
    upgrade_product_info: Mapped[str] = mapped_column(Text, nullable=True)
    new_laptop_serial: Mapped[str] = mapped_column(String(100), nullable=True)
    is_accepted: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=text("false")
    )

    upgrade_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    upgrade_product_type: Mapped[str] = mapped_column(String(122), nullable=True)

    candidate = relationship("Candidate", back_populates="upgrade")
