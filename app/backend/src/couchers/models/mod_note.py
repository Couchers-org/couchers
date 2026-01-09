from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Index, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from couchers.models.base import Base

if TYPE_CHECKING:
    from couchers.models.users import User


class ModNote(Base, init=False, kw_only=True):
    """
    A moderator note to a user. This could be a warning, just a note "hey, we did X", or any other similar message.

    The user has to read and "acknowledge" the note before continuing onto the platform, and being un-jailed.
    """

    __tablename__ = "mod_notes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    created: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), init=False)
    acknowledged: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # this is an internal ID to allow the mods to track different types of notes
    internal_id: Mapped[str] = mapped_column(String)
    # the admin that left this note
    creator_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    note_content: Mapped[str] = mapped_column(String)  # CommonMark without images

    user: Mapped[User] = relationship(foreign_keys="ModNote.user_id", back_populates="mod_notes")

    def __repr__(self) -> str:
        return f"ModeNote(id={self.id}, user={self.user}, created={self.created}, ack'd={self.acknowledged})"

    @hybrid_property
    def is_pending(self) -> bool:
        return self.acknowledged == None

    __table_args__ = (
        # used to look up pending notes
        Index(
            "ix_mod_notes_unacknowledged",
            user_id,
            postgresql_where=acknowledged == None,
        ),
    )
