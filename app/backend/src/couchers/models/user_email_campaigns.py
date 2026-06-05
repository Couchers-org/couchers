from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class UserEmailCampaignSend(Base, kw_only=True):
    __tablename__ = "user_email_campaign_sends"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    campaign_key: Mapped[str] = mapped_column(String)
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)

    user: Mapped[User] = relationship(init=False)

    __table_args__ = (
        UniqueConstraint("user_id", "campaign_key", name="uq_user_email_campaign_sends_user_id_campaign_key"),
        Index("ix_user_email_campaign_sends_campaign_key", "campaign_key"),
    )
