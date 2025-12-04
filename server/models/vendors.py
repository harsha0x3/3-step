from db.base import Base, BaseMixin
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Vendor(Base, BaseMixin):
    __tablename__ = "vendors"

    vendor_name: Mapped[str] = mapped_column(String(222), nullable=False)
    vendor_owner: Mapped[str] = mapped_column(Text, nullable=True)
    mobile_number: Mapped[str] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(64), nullable=True)

    vendor_spocs = relationship("VendorSpoc", back_populates="vendor")


class VendorSpoc(Base, BaseMixin):
    __tablename__ = "vendor_spoc"

    vendor_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("vendors.id", onupdate="cascade"),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(222), nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(64), nullable=True)
    photo: Mapped[str] = mapped_column(Text, nullable=True)

    vendor = relationship("Vendor", back_populates="vendor_spocs")
    candidates = relationship("Candidate", back_populates="vendor_spoc")
