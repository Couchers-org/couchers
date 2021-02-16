"""new profile fields

Revision ID: a98d5e645719
Revises: 6507ac862688
Create Date: 2021-02-16 23:19:12.390108

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a98d5e645719"
down_revision = "6507ac862688"
branch_labels = None
depends_on = None


def upgrade():
    meetup_status = sa.Enum("wants_to_meetup", "open_to_meetup", "does_not_want_to_meetup", name="meetupstatus")
    meetup_status.create(op.get_bind())
    parking_details = sa.Enum("free_onsite", "free_offsite", "paid_onsite", "paid_offsite", name="parkingdetails")
    parking_details.create(op.get_bind())
    op.add_column("users", sa.Column("additional_information", sa.String(), nullable=True))
    op.add_column("users", sa.Column("camping_ok", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("drinking_allowed", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("drinks_at_home", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("education", sa.String(), nullable=True))
    op.add_column("users", sa.Column("has_housemates", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("has_kids", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("has_pets", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("hometown", sa.String(), nullable=True))
    op.add_column("users", sa.Column("housemate_details", sa.String(), nullable=True))
    op.add_column("users", sa.Column("kid_details", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "meetup_status",
            meetup_status,
            nullable=True,
        ),
    )
    op.add_column("users", sa.Column("my_travels", sa.String(), nullable=True))
    op.add_column("users", sa.Column("other_host_info", sa.String(), nullable=True))
    op.add_column("users", sa.Column("parking", sa.Boolean(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "parking_details",
            parking_details,
            nullable=True,
        ),
    )
    op.add_column("users", sa.Column("pet_details", sa.String(), nullable=True))
    op.add_column("users", sa.Column("pronouns", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sleeping_details", sa.String(), nullable=True))
    op.add_column("users", sa.Column("smokes_at_home", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("things_i_like", sa.String(), nullable=True))
    op.drop_column("users", "color")
    op.drop_column("users", "multiple_groups")


def downgrade():
    op.add_column("users", sa.Column("multiple_groups", sa.BOOLEAN(), autoincrement=False, nullable=True))
    op.add_column("users", sa.Column("color", sa.VARCHAR(), autoincrement=False, nullable=False))
    op.drop_column("users", "things_i_like")
    op.drop_column("users", "smokes_at_home")
    op.drop_column("users", "sleeping_details")
    op.drop_column("users", "pronouns")
    op.drop_column("users", "pet_details")
    op.drop_column("users", "parking_details")
    op.drop_column("users", "parking")
    op.drop_column("users", "other_host_info")
    op.drop_column("users", "my_travels")
    op.drop_column("users", "meetup_status")
    op.drop_column("users", "kid_details")
    op.drop_column("users", "housemate_details")
    op.drop_column("users", "hometown")
    op.drop_column("users", "has_pets")
    op.drop_column("users", "has_kids")
    op.drop_column("users", "has_housemates")
    op.drop_column("users", "education")
    op.drop_column("users", "drinks_at_home")
    op.drop_column("users", "drinking_allowed")
    op.drop_column("users", "camping_ok")
    op.drop_column("users", "additional_information")
