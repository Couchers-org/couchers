"""Make hosting status non-nullable

Revision ID: 9261e9647b69
Revises: 13fe6ada1535
Create Date: 2022-02-14 10:13:18.444848

"""
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "9261e9647b69"
down_revision = "13fe6ada1535"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE users SET hosting_status = 'cant_host' WHERE hosting_status IS NULL")
    op.execute("UPDATE users SET meetup_status = 'does_not_want_to_meetup' WHERE meetup_status IS NULL")
    op.alter_column(
        "users",
        "hosting_status",
        existing_type=postgresql.ENUM("can_host", "maybe", "cant_host", name="hostingstatus"),
        nullable=False,
    )
    op.alter_column(
        "users",
        "meetup_status",
        existing_type=postgresql.ENUM(
            "wants_to_meetup", "open_to_meetup", "does_not_want_to_meetup", name="meetupstatus"
        ),
        nullable=False,
    )
    op.execute("ALTER TABLE users ALTER COLUMN meetup_status SET DEFAULT 'open_to_meetup'")


def downgrade():
    op.alter_column(
        "users",
        "meetup_status",
        existing_type=postgresql.ENUM(
            "wants_to_meetup", "open_to_meetup", "does_not_want_to_meetup", name="meetupstatus"
        ),
        nullable=True,
    )
    op.alter_column(
        "users",
        "hosting_status",
        existing_type=postgresql.ENUM("can_host", "maybe", "cant_host", name="hostingstatus"),
        nullable=True,
    )
