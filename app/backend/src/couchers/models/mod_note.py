from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Index, String, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import backref, relationship

from couchers.models.base import Base


class ModNote(Base):
    """
    A moderator note to a user. This could be a warning, just a note "hey, we did X", or any other similar message.

    The user has to read and "acknowledge" the note before continuing onto the platform, and being un-jailed.
    """

    __tablename__ = "mod_notes"
    id = Column(BigInteger, primary_key=True)

    user_id = Column(ForeignKey("users.id"), nullable=False, index=True)

    created = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    acknowledged = Column(DateTime(timezone=True), nullable=True)

    # this is an internal ID to allow the mods to track different types of notes
    internal_id = Column(String, nullable=False)
    # the admin that left this note
    creator_user_id = Column(ForeignKey("users.id"), nullable=False)

    note_content = Column(String, nullable=False)  # CommonMark without images

    user = relationship("User", backref=backref("mod_notes", lazy="dynamic"), foreign_keys="ModNote.user_id")

    def __repr__(self):
        return f"ModeNote(id={self.id}, user={self.user}, created={self.created}, ack'd={self.acknowledged})"

    @hybrid_property
    def is_pending(self):
        return self.acknowledged == None

    __table_args__ = (
        # used to look up pending notes
        Index(
            "ix_mod_notes_unacknowledged",
            user_id,
            postgresql_where=acknowledged == None,
        ),
    )
