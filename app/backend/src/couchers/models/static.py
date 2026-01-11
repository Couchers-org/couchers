from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from couchers.models.base import Base, Geom


class Language(Base, kw_only=True):
    """
    Table of allowed languages (a subset of ISO639-3)
    """

    __tablename__ = "languages"

    # ISO639-3 language code, in lowercase, e.g. fin, eng
    code: Mapped[str] = mapped_column(String(3), primary_key=True)

    # the english name
    name: Mapped[str] = mapped_column(String, unique=True)


class TimezoneArea(Base, kw_only=True):
    __tablename__ = "timezone_areas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tzid: Mapped[str | None] = mapped_column(String, default=None)
    geom: Mapped[Geom] = mapped_column(Geometry(geometry_type="MULTIPOLYGON", srid=4326))

    __table_args__ = (
        Index(
            "ix_timezone_areas_geom_tzid",
            geom,
            tzid,
            postgresql_using="gist",
        ),
    )


class Region(Base, kw_only=True):
    """
    Table of regions
    """

    __tablename__ = "regions"

    # iso 3166-1 alpha3 code in uppercase, e.g. FIN, USA
    code: Mapped[str] = mapped_column(String(3), primary_key=True)

    # the name, e.g. Finland, United States
    # this is the display name in English, should be the "common name", not "Republic of Finland"
    name: Mapped[str] = mapped_column(String, unique=True)
