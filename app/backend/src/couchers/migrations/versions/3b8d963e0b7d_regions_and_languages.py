"""Regions and languages

Revision ID: 3b8d963e0b7d
Revises: 2c6aaada8bff
Create Date: 2021-05-10 16:22:59.580595

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.orm.session import Session

from couchers.resources import copy_resources_to_database

# revision identifiers, used by Alembic.
revision = "3b8d963e0b7d"
down_revision = "2c6aaada8bff"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "timezone_areas",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("tzid", sa.String(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"
            ),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_timezone_areas")),
    )
    op.create_table(
        "languages",
        sa.Column("code", sa.String(length=3), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("code", name=op.f("pk_languages")),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("name", name=op.f("uq_languages_name")),
    )
    op.create_table(
        "regions",
        sa.Column("code", sa.String(length=3), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("code", name=op.f("pk_regions")),
        sa.UniqueConstraint("name"),
        sa.UniqueConstraint("name", name=op.f("uq_regions_name")),
    )
    op.create_table(
        "language_abilities",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("language_code", sa.String(length=3), nullable=False),
        sa.Column(
            "fluency",
            sa.Enum("say_hello", "beginner", "intermediate", "advanced", "fluent", "native", name="languagefluency"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["language_code"],
            ["languages.code"],
            name=op.f("fk_language_abilities_language_code_languages"),
            deferrable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_language_abilities_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_language_abilities")),
        sa.UniqueConstraint("user_id", "language_code", name=op.f("uq_language_abilities_user_id")),
    )
    op.create_index(op.f("ix_language_abilities_user_id"), "language_abilities", ["user_id"], unique=False)
    op.create_table(
        "regions_lived",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("region_code", sa.String(length=3), nullable=False),
        sa.ForeignKeyConstraint(
            ["region_code"], ["regions.code"], name=op.f("fk_regions_lived_region_code_regions"), deferrable=True
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_regions_lived_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_regions_lived")),
        sa.UniqueConstraint("user_id", "region_code", name=op.f("uq_regions_lived_user_id")),
    )
    op.create_index(op.f("ix_regions_lived_user_id"), "regions_lived", ["user_id"], unique=False)
    op.create_table(
        "regions_visited",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("region_code", sa.String(length=3), nullable=False),
        sa.ForeignKeyConstraint(
            ["region_code"], ["regions.code"], name=op.f("fk_regions_visited_region_code_regions"), deferrable=True
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_regions_visited_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_regions_visited")),
        sa.UniqueConstraint("user_id", "region_code", name=op.f("uq_regions_visited_user_id")),
    )
    op.create_index(op.f("ix_regions_visited_user_id"), "regions_visited", ["user_id"], unique=False)
    op.drop_column("users", "languages")
    op.drop_column("users", "countries_visited")
    op.drop_column("users", "countries_lived")

    session = Session(bind=op.get_bind())
    copy_resources_to_database(session)
    session.commit()


def downgrade():
    op.add_column("users", sa.Column("countries_lived", sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column("users", sa.Column("countries_visited", sa.VARCHAR(), autoincrement=False, nullable=True))
    op.add_column("users", sa.Column("languages", sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_index(op.f("ix_regions_visited_user_id"), table_name="regions_visited")
    op.drop_table("regions_visited")
    op.drop_index(op.f("ix_regions_lived_user_id"), table_name="regions_lived")
    op.drop_table("regions_lived")
    op.drop_index(op.f("ix_language_abilities_user_id"), table_name="language_abilities")
    op.drop_table("language_abilities")
    op.drop_table("regions")
    op.drop_table("languages")
    op.drop_table("timezone_areas")
