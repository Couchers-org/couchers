"""Force passwords fully

Revision ID: 461446320dfa
Revises: f53ecea60964
Create Date: 2024-06-08 22:03:05.229923

"""

from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "461446320dfa"
down_revision = "f53ecea60964"
branch_labels = None
depends_on = None


def upgrade():
    # this will set the password to a zero-length binary value. it means the hashed password will never verify, so this is the same as having an unguessable password.
    op.execute("UPDATE USERS SET hashed_password = '\\x' WHERE hashed_password IS NULL")
    op.alter_column("users", "hashed_password", existing_type=postgresql.BYTEA(), nullable=False)
    op.drop_column("users", "old_email_token_expiry")
    op.drop_column("users", "need_to_confirm_via_old_email")
    op.drop_column("users", "need_to_confirm_via_new_email")
    op.drop_column("users", "old_email_token")
    op.drop_column("users", "old_email_token_created")

    op.create_check_constraint(
        constraint_name="check_new_email_token_state",
        table_name="users",
        condition="(new_email_token IS NOT NULL AND new_email_token_created IS NOT NULL AND new_email_token_expiry IS NOT NULL) OR \
             (new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL)",
    )


def downgrade():
    raise Exception("Can't downgrade")
