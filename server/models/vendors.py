from db.base import Base, BaseMixin
from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Vendor(Base, BaseMixin):
    __tablename__ = "vendors"

    vendor_name: Mapped[str] = mapped_column(String(222), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    contact: Mapped[str] = mapped_column(String(100), nullable=True)

    vendor_spoc = relationship("VendorSpoc", back_populates="vendor")


class VendorSpoc(Base, BaseMixin):
    __tablename__ = "vendor_spoc"

    vendor_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("vendors.id"),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String(222), nullable=False)
    contact: Mapped[str] = mapped_column(String(100), nullable=True)
    photo: Mapped[str] = mapped_column(Text, nullable=True)

    vendor = relationship("Vendor", back_populates="vendor_spocs")
    candidates = relationship("Candidate", back_populates="vendor_spoc")
