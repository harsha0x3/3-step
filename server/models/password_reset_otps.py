from db.base import Base, BaseMixin
from sqlalchemy import String, ForeignKey, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone, timedelta
import random


class PasswordResetOtp(Base, BaseMixin):
    __tablename__ = "password_reset_otps"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", onupdate="cascade"), nullable=False
    )
    otp: Mapped[str] = mapped_column(String(10), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=20),
    )

    def generate_otp(self):
        otp = random.randint(100000, 999999)
        self.otp = str(otp)
        self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=20)
        return str(otp)

    def verify_otp(self, received_otp: str) -> bool:
        return self.otp == received_otp
