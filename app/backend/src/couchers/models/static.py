from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, Column, Index, String

from couchers.models.base import Base


class Language(Base):
    """
    Table of allowed languages (a subset of ISO639-3)
    """

    __tablename__ = "languages"

    # ISO639-3 language code, in lowercase, e.g. fin, eng
    code = Column(String(3), primary_key=True)

    # the english name
    name = Column(String, nullable=False, unique=True)


class TimezoneArea(Base):
    __tablename__ = "timezone_areas"
    id = Column(BigInteger, primary_key=True)

    tzid = Column(String)
    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=False)

    __table_args__ = (
        Index(
            "ix_timezone_areas_geom_tzid",
            geom,
            tzid,
            postgresql_using="gist",
        ),
    )


class Region(Base):
    """
    Table of regions
    """

    __tablename__ = "regions"

    # iso 3166-1 alpha3 code in uppercase, e.g. FIN, USA
    code = Column(String(3), primary_key=True)

    # the name, e.g. Finland, United States
    # this is the display name in English, should be the "common name", not "Republic of Finland"
    name = Column(String, nullable=False, unique=True)
