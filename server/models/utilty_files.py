from db.base import Base, BaseMixin
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column


class UtilityFile(Base, BaseMixin):
    __tablename__ = "utility_files"

    type: Mapped[str] = mapped_column(String(222), nullable=False)
    path: Mapped[str] = mapped_column(String(512), nullable=False)

    __table_args__ = (
        UniqueConstraint("type", "path", name="uq_utility_files_type_path"),
    )
