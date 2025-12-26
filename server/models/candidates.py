from db.base import Base, BaseMixin
from sqlalchemy import String, Text, ForeignKey, Boolean, Index, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from services.aadhar.utils import hash_aadhar_number, verify_aadhar_number_service
from datetime import date


class Candidate(Base, BaseMixin):
    __tablename__ = "candidates"

    coupon_code: Mapped[str] = mapped_column(
        String(15), nullable=True, unique=True, index=True
    )

    full_name: Mapped[str] = mapped_column(String(512), nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=True, unique=True)

    dob: Mapped[date] = mapped_column(Date, nullable=True)
    state: Mapped[str] = mapped_column(String(64), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    division: Mapped[str] = mapped_column(String(555), nullable=True)

    aadhar_number_hashed: Mapped[str | None] = mapped_column(String(100), nullable=True)
    aadhar_number_masked: Mapped[str | None] = mapped_column(String(36), nullable=True)
    aadhar_photo: Mapped[str | None] = mapped_column(Text, nullable=True)

    photo: Mapped[str | None] = mapped_column(Text, nullable=True)

    store_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("stores.id", onupdate="cascade"), nullable=True
    )
    vendor_spoc_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("vendor_spoc.id", ondelete="set null", onupdate="cascade"),
        nullable=True,
    )
    verified_by: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("users.id", ondelete="set null", onupdate="cascade"),
        nullable=True,
    )
    is_candidate_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=True
    )

    gift_card_code: Mapped[str] = mapped_column(String(30), nullable=True)

    # ------Relationships ------

    store = relationship("Store", back_populates="candidates")
    verification_status = relationship(
        "VerificationStatus", back_populates="candidate", uselist=False
    )
    issued_status = relationship(
        "IssuedStatus", back_populates="candidate", uselist=False
    )
    vendor_spoc = relationship("VendorSpoc", back_populates="candidates")
    upgrade = relationship("UpgradeRequest", back_populates="candidate", uselist=False)

    def set_aadhar_number(self, plain_aadhar_number: str) -> None:
        self.aadhar_number_hashed = hash_aadhar_number(plain_aadhar_number)

    def verify_aadhar_number(self, plain_aadhar_number: str) -> bool:
        if not self.aadhar_number_hashed:
            return False
        return verify_aadhar_number_service(
            plain_aadhar_number=plain_aadhar_number,
            hashed_aadhar_number=self.aadhar_number_hashed,
        )

    def set_mask_aadhar_number(self, aadhar_number: str, visible_digits: int = 4):
        if not aadhar_number:
            return None

        # Remove spaces or hyphens
        clean = "".join(filter(str.isdigit, aadhar_number))

        if len(clean) != 12:
            raise ValueError("Invalid Aadhaar number length")

        masked_part = "X" * (len(clean) - visible_digits)
        visible_part = clean[-visible_digits:]

        masked = masked_part + visible_part

        # Format as XXXX-XXXX-1234
        masked_out = "-".join(masked[i : i + 4] for i in range(0, 12, 4))
        self.aadhar_number_masked = masked_out
        return masked_out

    __table_args__ = (Index("ix_candidates_coupon", "coupon_code"),)

    def __repr__(self):
        return f"<Candidate(id={self.id}, store_id='{self.store_id}', coupon='{self.coupon_code}', full_name='{self.full_name}')>"
