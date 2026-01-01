from geoalchemy2 import WKBElement, WKTElement
from sqlalchemy import MetaData, Sequence, inspect
from sqlalchemy import __version__ as sqla_version
from sqlalchemy.orm import MANYTOONE, DeclarativeBase

meta = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)


class Base(DeclarativeBase):
    metadata = meta

    def __post_init__(self) -> None:
        """Needed until sqlalchemy 2.1 to avoid issues with relationships.
        See https://github.com/sqlalchemy/sqlalchemy/issues/12168#issuecomment-2892092715.
        """
        if sqla_version.startswith("2.1"):  # pragma: no cover
            raise RuntimeError("Time to remove this post init")

        for m2o_rel in (r for r in inspect(self).mapper.relationships if r.direction is MANYTOONE):
            if self.__dict__.get(m2o_rel.key, False) is None:
                self.__dict__.pop(m2o_rel.key, None)


communities_seq = Sequence("communities_seq")
moderation_seq = Sequence("moderation_seq", start=2_000_000)

Geom = WKBElement | WKTElement
