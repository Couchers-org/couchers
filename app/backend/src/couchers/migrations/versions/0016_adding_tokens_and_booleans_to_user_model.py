"""adding tokens and booleans to user model

Revision ID: 0016
Revises: 0015
Create Date: 2021-06-14 02:27:05.166141

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # clear existing new email stuff
    op.execute(
        "UPDATE users SET new_email = NULL, new_email_token = NULL, new_email_token_created = NULL, new_email_token_expiry = NULL"
    )

    op.add_column("users", sa.Column("need_to_confirm_via_new_email", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("need_to_confirm_via_old_email", sa.Boolean(), nullable=True))
    op.add_column("users", sa.Column("old_email_token", sa.String(), nullable=True))
    op.add_column("users", sa.Column("old_email_token_created", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("old_email_token_expiry", sa.DateTime(timezone=True), nullable=True))

    op.create_check_constraint(
        constraint_name="check_old_email_token_state",
        table_name="users",
        condition="(need_to_confirm_via_old_email IS NULL AND old_email_token IS NULL AND old_email_token_created IS NULL AND old_email_token_expiry IS NULL) OR \
         (need_to_confirm_via_old_email IS TRUE AND old_email_token IS NOT NULL AND old_email_token_created IS NOT NULL AND old_email_token_expiry IS NOT NULL) OR \
         (need_to_confirm_via_old_email IS FALSE AND old_email_token IS NULL AND old_email_token_created IS NULL AND old_email_token_expiry IS NULL)",
    )
    op.create_check_constraint(
        constraint_name="check_new_email_token_state",
        table_name="users",
        condition="(need_to_confirm_via_new_email IS NULL AND new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL) OR \
         (need_to_confirm_via_new_email IS TRUE AND new_email_token IS NOT NULL AND new_email_token_created IS NOT NULL AND new_email_token_expiry IS NOT NULL) OR \
         (need_to_confirm_via_new_email IS FALSE AND new_email_token IS NULL AND new_email_token_created IS NULL AND new_email_token_expiry IS NULL)",
    )


def downgrade() -> None:
    op.drop_column("users", "old_email_token_expiry")
    op.drop_column("users", "old_email_token_created")
    op.drop_column("users", "old_email_token")
    op.drop_column("users", "need_to_confirm_via_old_email")
    op.drop_column("users", "need_to_confirm_via_new_email")
    op.drop_constraint("check_old_email_token_state")
    op.drop_constraint("check_new_email_token_state")
