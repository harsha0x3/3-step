from db.base import Base, BaseMixin
from sqlalchemy import String, Text, ForeignKey, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from services.aadhar.utils import hash_aadhar_number, verify_aadhar_number


class Candidate(Base, BaseMixin):
    __tablename__ = "candidates"

    coupon_code: Mapped[str] = mapped_column(
        String(15), nullable=True, unique=True, index=True
    )

    full_name: Mapped[str] = mapped_column(String(512), nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=True)
    aadhar_number: Mapped[str] = mapped_column(String(255))
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=True, unique=True)
    email: Mapped[str] = mapped_column(String(64), nullable=True, unique=True)
    address: Mapped[str] = mapped_column(Text, nullable=True)

    photo: Mapped[str] = mapped_column(Text, nullable=True)

    store_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("stores.id"), nullable=True
    )
    vendor_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("vendor_spoc.id", ondelete="set null"), nullable=True
    )
    is_candidate_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=True
    )

    store = relationship("Store", back_populates="candidates")
    verification_status = relationship(
        "VerificationStatus", back_populates="candidate", uselist=False
    )
    issued_status = relationship(
        "IssuedStatus", back_populates="candidate", uselist=False
    )
    vendor_spoc = relationship("VendorSpoc", back_populates="candidates")

    def set_aadhar_number(self, plain_aadhar_number: str) -> None:
        self.aadhar_number = hash_aadhar_number(plain_aadhar_number)

    def verify_aadhar_number(self, plain_aadhar_number: str) -> bool:
        return verify_aadhar_number(
            plain_aadhar_number=plain_aadhar_number,
            hashed_aadhar_number=self.aadhar_number,
        )

    __table_args__ = (Index("ix_candidates_coupon", "coupon_code"),)

    def __repr__(self):
        return f"<Candidate(id={self.id}, store_id='{self.store_id}', coupon='{self.coupon_code}', full_name='{self.full_name}')>"
