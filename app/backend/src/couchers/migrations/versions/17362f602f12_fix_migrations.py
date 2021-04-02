"""Fix migrations

Revision ID: 17362f602f12
Revises: 02eda17d1e9b
Create Date: 2021-02-25 18:38:21.988120

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "17362f602f12"
down_revision = "02eda17d1e9b"
branch_labels = None
depends_on = None


def upgrade():
    # add correct default nextvals for community objects
    op.alter_column("nodes", "id", server_default=sa.text("nextval('communities_seq')"))
    op.alter_column("clusters", "id", server_default=sa.text("nextval('communities_seq')"))
    op.alter_column("discussions", "id", server_default=sa.text("nextval('communities_seq')"))
    op.alter_column("events", "id", server_default=sa.text("nextval('communities_seq')"))
    op.alter_column("pages", "id", server_default=sa.text("nextval('communities_seq')"))
    # drop lingering type
    op.execute("DROP TYPE hostrequesteventtype")
    # fix up wrongly named constraints
    op.execute(
        "ALTER TABLE pages RENAME CONSTRAINT ck_pages_ck_pages_main_page_owned_by_cluster TO ck_pages_main_page_owned_by_cluster"
    )
    op.execute("ALTER TABLE pages RENAME CONSTRAINT ck_pages_ck_pages_one_owner TO ck_pages_one_owner")
    op.execute(
        "ALTER TABLE initiated_uploads RENAME CONSTRAINT fk_initiated_uploads_user_id_users TO fk_initiated_uploads_initiator_user_id_users"
    )
    # fix sequence types
    op.execute("ALTER SEQUENCE complaints_id_seq AS bigint")
    op.execute("ALTER SEQUENCE conversations_id_seq AS bigint")
    op.execute("ALTER SEQUENCE friend_relationships_id_seq AS bigint")
    op.execute("ALTER SEQUENCE group_chat_subscriptions_id_seq AS bigint")
    op.execute("ALTER SEQUENCE messages_id_seq AS bigint")
    op.execute("ALTER SEQUENCE references_id_seq AS bigint")
    op.execute("ALTER SEQUENCE users_id_seq AS bigint")
    # remove 'reserved' from backgroundjobstate
    op.execute(
        """
    CREATE TYPE backgroundjobstate_new AS ENUM ('pending', 'completed', 'error', 'failed');
    DELETE FROM background_jobs WHERE state = 'reserved';
    ALTER TABLE background_jobs ALTER COLUMN state TYPE backgroundjobstate_new USING (state::text::backgroundjobstate_new);
    DROP TYPE backgroundjobstate;
    ALTER TYPE backgroundjobstate_new RENAME TO backgroundjobstate;
    """
    )
    # fix host requests sequence stuff
    op.execute(
        """
    ALTER TABLE host_requests ALTER COLUMN id DROP DEFAULT;
    DROP SEQUENCE host_requests_id_seq;
    """
    )
    # fix session expiry time
    op.execute("ALTER TABLE sessions ALTER COLUMN expiry SET DEFAULT now() + '90 days'::interval")
    # drop server default from accepted_tos
    op.execute("ALTER TABLE users ALTER COLUMN accepted_tos DROP DEFAULT")


def downgrade():
    raise Exception("Can't downgrade this")
