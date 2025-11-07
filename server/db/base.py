import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, String, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    pass


class BaseMixin:
    id: Mapped[str] = mapped_column(
        String(40), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()  # type: ignore

    def to_dict(self) -> dict[str, Any]:
        result = {
            col.name: getattr(self, col.name)
            for col in self.__table__.columns  # type:ignore
        }
        return result
