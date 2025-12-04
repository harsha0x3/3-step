from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship, mapped_column, Mapped

from datetime import datetime, timezone
from db.base import Base, BaseMixin
import uuid


class BulkUploadResult(Base, BaseMixin):
    """Store results of bulk offline issuance uploads"""

    __tablename__ = "bulk_upload_results"

    store_id: Mapped[str] = mapped_column(
        String(40), ForeignKey("stores.id", onupdate="cascade"), nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(199), nullable=False)

    # Upload statistics
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    successful_count: Mapped[int] = mapped_column(Integer, nullable=False)
    failed_count: Mapped[int] = mapped_column(Integer, nullable=False)

    errors = relationship(
        "BulkUploadError", back_populates="upload", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<BulkUploadResult {self.id} - {self.successful_count}/{self.total_rows} successful>"


class BulkUploadError(Base, BaseMixin):
    """Store individual row errors from bulk uploads"""

    __tablename__ = "bulk_upload_errors"

    upload_id: Mapped[str] = mapped_column(
        String(40),
        ForeignKey("bulk_upload_results.id", onupdate="cascade"),
        nullable=False,
    )

    # Error details
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    beneficiary_employee_id: Mapped[str] = mapped_column(String(40), nullable=True)
    error_message: Mapped[str] = mapped_column(Text, nullable=False)

    # Additional context
    voucher_code: Mapped[str] = mapped_column(String(15), nullable=True)
    laptop_serial: Mapped[str] = mapped_column(String(40), nullable=True)

    # Relationships
    upload = relationship("BulkUploadResult", back_populates="errors")

    def __repr__(self):
        return f"<BulkUploadError Row {self.row_number}: {self.error_message}>"
