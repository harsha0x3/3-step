from db.base import Base, BaseMixin
from sqlalchemy import String, Text, Date, ForeignKey, Boolean
from datetime import date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from services.aadhar.utils import hash_aadhar_number, verify_aadhar_number


class Candidate(Base, BaseMixin):
    __tablename__ = "candidates"

    full_name: Mapped[str] = mapped_column(String(512), nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    dob: Mapped[date] = mapped_column(Date, nullable=False)
    aadhar_number: Mapped[str] = mapped_column(String(255))
    aadhar_last_four_digits: Mapped[str] = mapped_column(String(5), nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(15), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(64), nullable=True, unique=True)
    disability_type: Mapped[str] = mapped_column(String(256), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=True)
    city: Mapped[str] = mapped_column(String(64), nullable=True)
    state: Mapped[str] = mapped_column(String(64), nullable=True)

    photo_url: Mapped[str] = mapped_column(Text, nullable=True)

    store_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("stores.id"), nullable=False
    )

    parent_name: Mapped[str] = mapped_column(String(256), nullable=True)
    parent_employee_code: Mapped[str] = mapped_column(String(64), nullable=True)
    parent_mobile_number: Mapped[str] = mapped_column(String(15), nullable=True)
    parent_email: Mapped[str] = mapped_column(String(64), nullable=True)
    parent_relation: Mapped[str] = mapped_column(String(64), nullable=True)
    parent_photo_url: Mapped[str] = mapped_column(Text, nullable=True)
    is_candidate_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    store = relationship("Store", back_populates="candidates")
    verification_status = relationship(
        "VerificationStatus", back_populates="candidate", uselist=False
    )
    issued_status = relationship(
        "IssuedStatus", back_populates="candidate", uselist=False
    )
    coupon = relationship("Coupon", back_populates="candidate", uselist=False)

    def set_aadhar_number(self, plain_aadhar_number: str) -> None:
        self.aadhar_number = hash_aadhar_number(plain_aadhar_number)

    def verify_aadhar_number(self, plain_aadhar_number: str) -> bool:
        return verify_aadhar_number(
            plain_aadhar_number=plain_aadhar_number,
            hashed_aadhar_number=self.aadhar_number,
        )

    def __repr__(self):
        return f"<Candidate(id={self.id}, store_id='{self.store_id}', email='{self.email}', full_name='{self.full_name}')>"
