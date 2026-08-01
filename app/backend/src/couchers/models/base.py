from geoalchemy2 import WKBElement, WKTElement
from sqlalchemy import MetaData, Sequence
from sqlalchemy.orm import (
    DeclarativeBase,
    MappedAsDataclass,
)

meta = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)


class MatViewBase(DeclarativeBase):
    metadata = meta


class Base(MappedAsDataclass, DeclarativeBase):
    metadata = meta


communities_seq = Sequence("communities_seq")
moderation_seq = Sequence("moderation_seq", start=2_000_000)
# named as postgres would for a bigserial, so emails.id can become a normal pkey once backfilled
emails_id_seq = Sequence("emails_id_seq")

Geom = WKBElement | WKTElement
