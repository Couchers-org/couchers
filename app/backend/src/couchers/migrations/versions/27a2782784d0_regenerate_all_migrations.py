"""Regenerate all migrations

Revision ID: 27a2782784d0
Revises:
Create Date: 2021-04-02 14:56:26.236084

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "27a2782784d0"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute(
        """
    -- slugify takes an arbitrary piece of text and turns it into a "slug" by replacing occurences of non-alphanumber
    -- characters with dashes, truncating, and then cleaning that up. We attempt to turn non-ascii characters to close
    -- ascii characters with unaccent. Slugs are useful in URLs, giving users a preview yet being URL "nice".
    -- e.g. slugify('Detta är ett test!') -> detta-ar-ett-test
    CREATE OR REPLACE FUNCTION slugify("text" TEXT)
    RETURNS TEXT AS $$
    SELECT regexp_replace(
      regexp_replace(
        substring(
          regexp_replace(
            lower(unaccent("text")),
            '[^a-z0-9\\-_]+', '-', 'gi'
          ) from 0 for 64
        ), '\-+$', ''
      ), '^\-', ''
    );
    $$ LANGUAGE SQL STRICT IMMUTABLE;
    """
    )
    op.execute("CREATE SEQUENCE communities_seq")
    op.create_table(
        "background_jobs",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column(
            "job_type",
            sa.Enum(
                "send_email",
                "purge_login_tokens",
                "purge_signup_tokens",
                "send_message_notifications",
                name="backgroundjobtype",
            ),
            nullable=False,
        ),
        sa.Column(
            "state", sa.Enum("pending", "completed", "error", "failed", name="backgroundjobstate"), nullable=False
        ),
        sa.Column("queued", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("next_attempt_after", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("try_count", sa.Integer(), nullable=False),
        sa.Column("max_tries", sa.Integer(), nullable=False),
        sa.Column("payload", sa.LargeBinary(), nullable=False),
        sa.Column("failure_info", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_background_jobs")),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_conversations")),
    )
    op.create_table(
        "emails",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("sender_name", sa.String(), nullable=False),
        sa.Column("sender_email", sa.String(), nullable=False),
        sa.Column("recipient", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("plain", sa.String(), nullable=False),
        sa.Column("html", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_emails")),
    )
    op.create_table(
        "nodes",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("parent_node_id", sa.BigInteger(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(
                geometry_type="MULTIPOLYGON", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"
            ),
            nullable=False,
        ),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["parent_node_id"], ["nodes.id"], name=op.f("fk_nodes_parent_node_id_nodes")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_nodes")),
    )
    op.create_index(op.f("ix_nodes_parent_node_id"), "nodes", ["parent_node_id"], unique=False)
    op.create_table(
        "signup_tokens",
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("token", name=op.f("pk_signup_tokens")),
    )
    op.create_table(
        "threads",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_threads")),
    )
    op.create_table(
        "uploads",
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("credit", sa.String(), nullable=True),
        # sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_uploads_creator_user_id_users")),
        sa.PrimaryKeyConstraint("key", name=op.f("pk_uploads")),
    )
    op.create_index(op.f("ix_uploads_creator_user_id"), "uploads", ["creator_user_id"], unique=False)
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.LargeBinary(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("phone_status", sa.Enum("unverified", "verified", name="phonestatus"), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=True,
        ),
        sa.Column("geom_radius", sa.Float(), nullable=True),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("hometown", sa.String(), nullable=True),
        sa.Column("joined", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_active", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_notified_message_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("gender", sa.String(), nullable=False),
        sa.Column("pronouns", sa.String(), nullable=True),
        sa.Column("birthdate", sa.Date(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("avatar_key", sa.String(), nullable=True),
        sa.Column("hosting_status", sa.Enum("can_host", "maybe", "cant_host", name="hostingstatus"), nullable=True),
        sa.Column(
            "meetup_status",
            sa.Enum("wants_to_meetup", "open_to_meetup", "does_not_want_to_meetup", name="meetupstatus"),
            nullable=True,
        ),
        sa.Column("verification", sa.Float(), nullable=True),
        sa.Column("community_standing", sa.Float(), nullable=True),
        sa.Column("occupation", sa.String(), nullable=True),
        sa.Column("education", sa.String(), nullable=True),
        sa.Column("about_me", sa.String(), nullable=True),
        sa.Column("my_travels", sa.String(), nullable=True),
        sa.Column("things_i_like", sa.String(), nullable=True),
        sa.Column("about_place", sa.String(), nullable=True),
        sa.Column("languages", sa.String(), nullable=True),
        sa.Column("countries_visited", sa.String(), nullable=True),
        sa.Column("countries_lived", sa.String(), nullable=True),
        sa.Column("additional_information", sa.String(), nullable=True),
        sa.Column("is_banned", sa.Boolean(), nullable=False),
        sa.Column("max_guests", sa.Integer(), nullable=True),
        sa.Column("last_minute", sa.Boolean(), nullable=True),
        sa.Column("has_pets", sa.Boolean(), nullable=True),
        sa.Column("accepts_pets", sa.Boolean(), nullable=True),
        sa.Column("pet_details", sa.String(), nullable=True),
        sa.Column("has_kids", sa.Boolean(), nullable=True),
        sa.Column("accepts_kids", sa.Boolean(), nullable=True),
        sa.Column("kid_details", sa.String(), nullable=True),
        sa.Column("has_housemates", sa.Boolean(), nullable=True),
        sa.Column("housemate_details", sa.String(), nullable=True),
        sa.Column("wheelchair_accessible", sa.Boolean(), nullable=True),
        sa.Column("smoking_allowed", sa.Enum("yes", "window", "outside", "no", name="smokinglocation"), nullable=True),
        sa.Column("smokes_at_home", sa.Boolean(), nullable=True),
        sa.Column("drinking_allowed", sa.Boolean(), nullable=True),
        sa.Column("drinks_at_home", sa.Boolean(), nullable=True),
        sa.Column("other_host_info", sa.String(), nullable=True),
        sa.Column(
            "sleeping_arrangement",
            sa.Enum("private", "common", "shared_room", "shared_space", name="sleepingarrangement"),
            nullable=True,
        ),
        sa.Column("sleeping_details", sa.String(), nullable=True),
        sa.Column("area", sa.String(), nullable=True),
        sa.Column("house_rules", sa.String(), nullable=True),
        sa.Column("parking", sa.Boolean(), nullable=True),
        sa.Column(
            "parking_details",
            sa.Enum("free_onsite", "free_offsite", "paid_onsite", "paid_offsite", name="parkingdetails"),
            nullable=True,
        ),
        sa.Column("camping_ok", sa.Boolean(), nullable=True),
        sa.Column("accepted_tos", sa.Integer(), nullable=False),
        sa.Column("new_email", sa.String(), nullable=True),
        sa.Column("new_email_token", sa.String(), nullable=True),
        sa.Column("new_email_token_created", sa.DateTime(timezone=True), nullable=True),
        sa.Column("new_email_token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["avatar_key"], ["uploads.key"], name=op.f("fk_users_avatar_key_uploads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
        sa.UniqueConstraint("phone", name=op.f("uq_users_phone")),
        sa.UniqueConstraint("username", name=op.f("uq_users_username")),
    )
    op.create_foreign_key("fk_uploads_creator_user_id_users", "uploads", "users", ["creator_user_id"], ["id"])
    op.create_table(
        "clusters",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("parent_node_id", sa.BigInteger(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_official_cluster", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["parent_node_id"], ["nodes.id"], name=op.f("fk_clusters_parent_node_id_nodes")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_clusters")),
    )
    op.create_index(
        "ix_clusters_owner_parent_node_id_is_official_cluster",
        "clusters",
        ["parent_node_id", "is_official_cluster"],
        unique=True,
        postgresql_where=sa.text("is_official_cluster"),
    )
    op.create_index(op.f("ix_clusters_parent_node_id"), "clusters", ["parent_node_id"], unique=False)
    op.create_table(
        "comments",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("thread_id", sa.BigInteger(), nullable=False),
        sa.Column("author_user_id", sa.BigInteger(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], name=op.f("fk_comments_author_user_id_users")),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], name=op.f("fk_comments_thread_id_threads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_comments")),
    )
    op.create_index(op.f("ix_comments_thread_id"), "comments", ["thread_id"], unique=False)
    op.create_table(
        "complaints",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("author_user_id", sa.BigInteger(), nullable=False),
        sa.Column("reported_user_id", sa.BigInteger(), nullable=False),
        sa.Column("reason", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], name=op.f("fk_complaints_author_user_id_users")),
        sa.ForeignKeyConstraint(["reported_user_id"], ["users.id"], name=op.f("fk_complaints_reported_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_complaints")),
    )
    op.create_index(op.f("ix_complaints_author_user_id"), "complaints", ["author_user_id"], unique=False)
    op.create_index(op.f("ix_complaints_reported_user_id"), "complaints", ["reported_user_id"], unique=False)
    op.create_table(
        "friend_relationships",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("from_user_id", sa.BigInteger(), nullable=False),
        sa.Column("to_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "status", sa.Enum("pending", "accepted", "rejected", "cancelled", name="friendstatus"), nullable=False
        ),
        sa.Column("time_sent", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("time_responded", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["from_user_id"], ["users.id"], name=op.f("fk_friend_relationships_from_user_id_users")
        ),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"], name=op.f("fk_friend_relationships_to_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_friend_relationships")),
    )
    op.create_index(
        op.f("ix_friend_relationships_from_user_id"), "friend_relationships", ["from_user_id"], unique=False
    )
    op.create_index(op.f("ix_friend_relationships_to_user_id"), "friend_relationships", ["to_user_id"], unique=False)
    op.create_table(
        "group_chats",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("only_admins_invite", sa.Boolean(), nullable=False),
        sa.Column("creator_id", sa.BigInteger(), nullable=False),
        sa.Column("is_dm", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], name=op.f("fk_group_chats_creator_id_users")),
        sa.ForeignKeyConstraint(["id"], ["conversations.id"], name=op.f("fk_group_chats_id_conversations")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_group_chats")),
    )
    op.create_index(op.f("ix_group_chats_creator_id"), "group_chats", ["creator_id"], unique=False)
    op.create_table(
        "host_requests",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("from_user_id", sa.BigInteger(), nullable=False),
        sa.Column("to_user_id", sa.BigInteger(), nullable=False),
        sa.Column("from_date", sa.Date(), nullable=False),
        sa.Column("to_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "accepted", "rejected", "confirmed", "cancelled", name="hostrequeststatus"),
            nullable=False,
        ),
        sa.Column("to_last_seen_message_id", sa.BigInteger(), nullable=False),
        sa.Column("from_last_seen_message_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"], name=op.f("fk_host_requests_from_user_id_users")),
        sa.ForeignKeyConstraint(["id"], ["conversations.id"], name=op.f("fk_host_requests_id_conversations")),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"], name=op.f("fk_host_requests_to_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_host_requests")),
    )
    op.create_index(op.f("ix_host_requests_from_user_id"), "host_requests", ["from_user_id"], unique=False)
    op.create_index(op.f("ix_host_requests_to_user_id"), "host_requests", ["to_user_id"], unique=False)
    op.create_table(
        "initiated_uploads",
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.Column("initiator_user_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["initiator_user_id"], ["users.id"], name=op.f("fk_initiated_uploads_initiator_user_id_users")
        ),
        sa.PrimaryKeyConstraint("key", name=op.f("pk_initiated_uploads")),
    )
    op.create_index(
        op.f("ix_initiated_uploads_initiator_user_id"), "initiated_uploads", ["initiator_user_id"], unique=False
    )
    op.create_table(
        "login_tokens",
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_login_tokens_user_id_users")),
        sa.PrimaryKeyConstraint("token", name=op.f("pk_login_tokens")),
    )
    op.create_index(op.f("ix_login_tokens_user_id"), "login_tokens", ["user_id"], unique=False)
    op.create_table(
        "messages",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("conversation_id", sa.BigInteger(), nullable=False),
        sa.Column("author_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "message_type",
            sa.Enum(
                "text",
                "chat_created",
                "chat_edited",
                "user_invited",
                "user_left",
                "user_made_admin",
                "user_removed_admin",
                "host_request_status_changed",
                name="messagetype",
            ),
            nullable=False,
        ),
        sa.Column("target_id", sa.BigInteger(), nullable=True),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("text", sa.String(), nullable=True),
        sa.Column(
            "host_request_status_target",
            sa.Enum("pending", "accepted", "rejected", "confirmed", "cancelled", name="hostrequeststatus"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], name=op.f("fk_messages_author_id_users")),
        sa.ForeignKeyConstraint(
            ["conversation_id"], ["conversations.id"], name=op.f("fk_messages_conversation_id_conversations")
        ),
        sa.ForeignKeyConstraint(["target_id"], ["users.id"], name=op.f("fk_messages_target_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_messages")),
    )
    op.create_index(op.f("ix_messages_author_id"), "messages", ["author_id"], unique=False)
    op.create_index(op.f("ix_messages_conversation_id"), "messages", ["conversation_id"], unique=False)
    op.create_index(op.f("ix_messages_target_id"), "messages", ["target_id"], unique=False)
    op.create_table(
        "password_reset_tokens",
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("expiry", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_password_reset_tokens_user_id_users")),
        sa.PrimaryKeyConstraint("token", name=op.f("pk_password_reset_tokens")),
    )
    op.create_index(op.f("ix_password_reset_tokens_user_id"), "password_reset_tokens", ["user_id"], unique=False)
    op.create_table(
        "sessions",
        sa.Column("token", sa.String(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("long_lived", sa.Boolean(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column(
            "expiry", sa.DateTime(timezone=True), server_default=sa.text("now() + interval '90 days'"), nullable=False
        ),
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("api_calls", sa.Integer(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_sessions_user_id_users")),
        sa.PrimaryKeyConstraint("token", name=op.f("pk_sessions")),
    )
    op.create_index(op.f("ix_sessions_user_id"), "sessions", ["user_id"], unique=False)
    op.create_table(
        "cluster_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("cluster_id", sa.BigInteger(), nullable=False),
        sa.Column("role", sa.Enum("member", "admin", name="clusterrole"), nullable=False),
        sa.ForeignKeyConstraint(
            ["cluster_id"], ["clusters.id"], name=op.f("fk_cluster_subscriptions_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_cluster_subscriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cluster_subscriptions")),
        sa.UniqueConstraint("user_id", "cluster_id", name=op.f("uq_cluster_subscriptions_user_id")),
    )
    op.create_index(op.f("ix_cluster_subscriptions_cluster_id"), "cluster_subscriptions", ["cluster_id"], unique=False)
    op.create_index(op.f("ix_cluster_subscriptions_user_id"), "cluster_subscriptions", ["user_id"], unique=False)
    op.create_table(
        "discussions",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("thread_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_discussions_creator_user_id_users")),
        sa.ForeignKeyConstraint(
            ["owner_cluster_id"], ["clusters.id"], name=op.f("fk_discussions_owner_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], name=op.f("fk_discussions_thread_id_threads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_discussions")),
        sa.UniqueConstraint("thread_id", name=op.f("uq_discussions_thread_id")),
    )
    op.create_index(op.f("ix_discussions_creator_user_id"), "discussions", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_discussions_owner_cluster_id"), "discussions", ["owner_cluster_id"], unique=False)
    op.create_table(
        "events",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("thread_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=False,
        ),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("photo", sa.String(), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("owner_user_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_cluster_id"], ["clusters.id"], name=op.f("fk_events_owner_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], name=op.f("fk_events_owner_user_id_users")),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], name=op.f("fk_events_thread_id_threads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_events")),
        sa.UniqueConstraint("thread_id", name=op.f("uq_events_thread_id")),
    )
    op.create_index(op.f("ix_events_owner_cluster_id"), "events", ["owner_cluster_id"], unique=True)
    op.create_index(op.f("ix_events_owner_user_id"), "events", ["owner_user_id"], unique=False)
    op.create_table(
        "group_chat_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("group_chat_id", sa.BigInteger(), nullable=False),
        sa.Column("joined", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("left", sa.DateTime(timezone=True), nullable=True),
        sa.Column("role", sa.Enum("admin", "participant", name="groupchatrole"), nullable=False),
        sa.Column("last_seen_message_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["group_chat_id"], ["group_chats.id"], name=op.f("fk_group_chat_subscriptions_group_chat_id_group_chats")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_group_chat_subscriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_group_chat_subscriptions")),
    )
    op.create_index(
        op.f("ix_group_chat_subscriptions_group_chat_id"), "group_chat_subscriptions", ["group_chat_id"], unique=False
    )
    op.create_index(op.f("ix_group_chat_subscriptions_user_id"), "group_chat_subscriptions", ["user_id"], unique=False)
    op.create_table(
        "node_cluster_associations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("node_id", sa.BigInteger(), nullable=False),
        sa.Column("cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["cluster_id"], ["clusters.id"], name=op.f("fk_node_cluster_associations_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["node_id"], ["nodes.id"], name=op.f("fk_node_cluster_associations_node_id_nodes")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_node_cluster_associations")),
        sa.UniqueConstraint("node_id", "cluster_id", name=op.f("uq_node_cluster_associations_node_id")),
    )
    op.create_index(
        op.f("ix_node_cluster_associations_cluster_id"), "node_cluster_associations", ["cluster_id"], unique=False
    )
    op.create_index(
        op.f("ix_node_cluster_associations_node_id"), "node_cluster_associations", ["node_id"], unique=False
    )
    op.create_table(
        "pages",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("parent_node_id", sa.BigInteger(), nullable=False),
        sa.Column("type", sa.Enum("main_page", "place", "guide", name="pagetype"), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("owner_user_id", sa.BigInteger(), nullable=True),
        sa.Column("owner_cluster_id", sa.BigInteger(), nullable=True),
        sa.Column("thread_id", sa.BigInteger(), nullable=False),
        sa.CheckConstraint(
            "NOT (owner_cluster_id IS NULL AND type = 'main_page')", name=op.f("ck_pages_main_page_owned_by_cluster")
        ),
        sa.CheckConstraint(
            "(owner_user_id IS NULL AND owner_cluster_id IS NOT NULL) OR (owner_user_id IS NOT NULL AND owner_cluster_id IS NULL)",
            name=op.f("ck_pages_one_owner"),
        ),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_pages_creator_user_id_users")),
        sa.ForeignKeyConstraint(["owner_cluster_id"], ["clusters.id"], name=op.f("fk_pages_owner_cluster_id_clusters")),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], name=op.f("fk_pages_owner_user_id_users")),
        sa.ForeignKeyConstraint(["parent_node_id"], ["nodes.id"], name=op.f("fk_pages_parent_node_id_nodes")),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], name=op.f("fk_pages_thread_id_threads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_pages")),
        sa.UniqueConstraint("thread_id", name=op.f("uq_pages_thread_id")),
    )
    op.create_index(op.f("ix_pages_creator_user_id"), "pages", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_pages_owner_cluster_id"), "pages", ["owner_cluster_id"], unique=False)
    op.create_index(
        "ix_pages_owner_cluster_id_type",
        "pages",
        ["owner_cluster_id", "type"],
        unique=True,
        postgresql_where=sa.text("type = 'main_page'"),
    )
    op.create_index(op.f("ix_pages_owner_user_id"), "pages", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_pages_parent_node_id"), "pages", ["parent_node_id"], unique=False)
    op.create_table(
        "references",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("time", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("from_user_id", sa.BigInteger(), nullable=False),
        sa.Column("to_user_id", sa.BigInteger(), nullable=False),
        sa.Column("reference_type", sa.Enum("friend", "surfed", "hosted", name="referencetype"), nullable=False),
        sa.Column("host_request_id", sa.BigInteger(), nullable=True),
        sa.Column("text", sa.String(), nullable=True),
        sa.Column("rating", sa.Float(), nullable=False),
        sa.Column("was_appropriate", sa.Boolean(), nullable=False),
        sa.CheckConstraint(
            "(host_request_id IS NULL AND reference_type = 'friend') OR (host_request_id IS NOT NULL AND reference_type != 'friend')",
            name=op.f("ck_references_host_request_id_xor_friend_reference"),
        ),
        sa.CheckConstraint("rating BETWEEN 0 AND 1", name=op.f("ck_references_rating_between_0_and_1")),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"], name=op.f("fk_references_from_user_id_users")),
        sa.ForeignKeyConstraint(
            ["host_request_id"], ["host_requests.id"], name=op.f("fk_references_host_request_id_host_requests")
        ),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"], name=op.f("fk_references_to_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_references")),
    )
    op.create_index(op.f("ix_references_from_user_id"), "references", ["from_user_id"], unique=False)
    op.create_index(op.f("ix_references_to_user_id"), "references", ["to_user_id"], unique=False)
    op.create_index(
        "ix_references_unique_friend_reference",
        "references",
        ["from_user_id", "to_user_id", "reference_type"],
        unique=True,
        postgresql_where=sa.text("reference_type = 'friend'"),
    )
    op.create_index(
        "ix_references_unique_per_host_request",
        "references",
        ["from_user_id", "to_user_id", "host_request_id"],
        unique=True,
        postgresql_where=sa.text("host_request_id IS NOT NULL"),
    )
    op.create_table(
        "replies",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("comment_id", sa.BigInteger(), nullable=False),
        sa.Column("author_user_id", sa.BigInteger(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], name=op.f("fk_replies_author_user_id_users")),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"], name=op.f("fk_replies_comment_id_comments")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_replies")),
    )
    op.create_index(op.f("ix_replies_comment_id"), "replies", ["comment_id"], unique=False)
    op.create_table(
        "cluster_discussion_associations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("discussion_id", sa.BigInteger(), nullable=False),
        sa.Column("cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["cluster_id"], ["clusters.id"], name=op.f("fk_cluster_discussion_associations_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(
            ["discussion_id"],
            ["discussions.id"],
            name=op.f("fk_cluster_discussion_associations_discussion_id_discussions"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cluster_discussion_associations")),
        sa.UniqueConstraint(
            "discussion_id", "cluster_id", name=op.f("uq_cluster_discussion_associations_discussion_id")
        ),
    )
    op.create_index(
        op.f("ix_cluster_discussion_associations_cluster_id"),
        "cluster_discussion_associations",
        ["cluster_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_cluster_discussion_associations_discussion_id"),
        "cluster_discussion_associations",
        ["discussion_id"],
        unique=False,
    )
    op.create_table(
        "cluster_event_associations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["cluster_id"], ["clusters.id"], name=op.f("fk_cluster_event_associations_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(
            ["event_id"], ["events.id"], name=op.f("fk_cluster_event_associations_event_id_events")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cluster_event_associations")),
        sa.UniqueConstraint("event_id", "cluster_id", name=op.f("uq_cluster_event_associations_event_id")),
    )
    op.create_index(
        op.f("ix_cluster_event_associations_cluster_id"), "cluster_event_associations", ["cluster_id"], unique=False
    )
    op.create_index(
        op.f("ix_cluster_event_associations_event_id"), "cluster_event_associations", ["event_id"], unique=False
    )
    op.create_table(
        "cluster_page_associations",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("page_id", sa.BigInteger(), nullable=False),
        sa.Column("cluster_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["cluster_id"], ["clusters.id"], name=op.f("fk_cluster_page_associations_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], name=op.f("fk_cluster_page_associations_page_id_pages")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cluster_page_associations")),
        sa.UniqueConstraint("page_id", "cluster_id", name=op.f("uq_cluster_page_associations_page_id")),
    )
    op.create_index(
        op.f("ix_cluster_page_associations_cluster_id"), "cluster_page_associations", ["cluster_id"], unique=False
    )
    op.create_index(
        op.f("ix_cluster_page_associations_page_id"), "cluster_page_associations", ["page_id"], unique=False
    )
    op.create_table(
        "discussion_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("discussion_id", sa.BigInteger(), nullable=False),
        sa.Column("joined", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("left", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["discussion_id"], ["discussions.id"], name=op.f("fk_discussion_subscriptions_discussion_id_discussions")
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_discussion_subscriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_discussion_subscriptions")),
        sa.UniqueConstraint("discussion_id", "user_id", name=op.f("uq_discussion_subscriptions_discussion_id")),
    )
    op.create_index(
        op.f("ix_discussion_subscriptions_discussion_id"), "discussion_subscriptions", ["discussion_id"], unique=False
    )
    op.create_index(op.f("ix_discussion_subscriptions_user_id"), "discussion_subscriptions", ["user_id"], unique=False)
    op.create_table(
        "event_subscriptions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("joined", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("fk_event_subscriptions_event_id_events")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_event_subscriptions_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_subscriptions")),
        sa.UniqueConstraint("event_id", "user_id", name=op.f("uq_event_subscriptions_event_id")),
    )
    op.create_index(op.f("ix_event_subscriptions_event_id"), "event_subscriptions", ["event_id"], unique=False)
    op.create_index(op.f("ix_event_subscriptions_user_id"), "event_subscriptions", ["user_id"], unique=False)
    op.create_table(
        "page_versions",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("page_id", sa.BigInteger(), nullable=False),
        sa.Column("editor_user_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("photo_key", sa.String(), nullable=True),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=True,
        ),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["editor_user_id"], ["users.id"], name=op.f("fk_page_versions_editor_user_id_users")),
        sa.ForeignKeyConstraint(["page_id"], ["pages.id"], name=op.f("fk_page_versions_page_id_pages")),
        sa.ForeignKeyConstraint(["photo_key"], ["uploads.key"], name=op.f("fk_page_versions_photo_key_uploads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_page_versions")),
    )
    op.create_index(op.f("ix_page_versions_editor_user_id"), "page_versions", ["editor_user_id"], unique=False)
    op.create_index(op.f("ix_page_versions_page_id"), "page_versions", ["page_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_page_versions_page_id"), table_name="page_versions")
    op.drop_index(op.f("ix_page_versions_editor_user_id"), table_name="page_versions")
    op.drop_table("page_versions")
    op.drop_index(op.f("ix_event_subscriptions_user_id"), table_name="event_subscriptions")
    op.drop_index(op.f("ix_event_subscriptions_event_id"), table_name="event_subscriptions")
    op.drop_table("event_subscriptions")
    op.drop_index(op.f("ix_discussion_subscriptions_user_id"), table_name="discussion_subscriptions")
    op.drop_index(op.f("ix_discussion_subscriptions_discussion_id"), table_name="discussion_subscriptions")
    op.drop_table("discussion_subscriptions")
    op.drop_index(op.f("ix_cluster_page_associations_page_id"), table_name="cluster_page_associations")
    op.drop_index(op.f("ix_cluster_page_associations_cluster_id"), table_name="cluster_page_associations")
    op.drop_table("cluster_page_associations")
    op.drop_index(op.f("ix_cluster_event_associations_event_id"), table_name="cluster_event_associations")
    op.drop_index(op.f("ix_cluster_event_associations_cluster_id"), table_name="cluster_event_associations")
    op.drop_table("cluster_event_associations")
    op.drop_index(
        op.f("ix_cluster_discussion_associations_discussion_id"), table_name="cluster_discussion_associations"
    )
    op.drop_index(op.f("ix_cluster_discussion_associations_cluster_id"), table_name="cluster_discussion_associations")
    op.drop_table("cluster_discussion_associations")
    op.drop_index(op.f("ix_replies_comment_id"), table_name="replies")
    op.drop_table("replies")
    op.drop_index("ix_references_unique_per_host_request", table_name="references")
    op.drop_index("ix_references_unique_friend_reference", table_name="references")
    op.drop_index(op.f("ix_references_to_user_id"), table_name="references")
    op.drop_index(op.f("ix_references_from_user_id"), table_name="references")
    op.drop_table("references")
    op.drop_index(op.f("ix_pages_parent_node_id"), table_name="pages")
    op.drop_index(op.f("ix_pages_owner_user_id"), table_name="pages")
    op.drop_index("ix_pages_owner_cluster_id_type", table_name="pages")
    op.drop_index(op.f("ix_pages_owner_cluster_id"), table_name="pages")
    op.drop_index(op.f("ix_pages_creator_user_id"), table_name="pages")
    op.drop_table("pages")
    op.drop_index(op.f("ix_node_cluster_associations_node_id"), table_name="node_cluster_associations")
    op.drop_index(op.f("ix_node_cluster_associations_cluster_id"), table_name="node_cluster_associations")
    op.drop_table("node_cluster_associations")
    op.drop_index(op.f("ix_group_chat_subscriptions_user_id"), table_name="group_chat_subscriptions")
    op.drop_index(op.f("ix_group_chat_subscriptions_group_chat_id"), table_name="group_chat_subscriptions")
    op.drop_table("group_chat_subscriptions")
    op.drop_index(op.f("ix_events_owner_user_id"), table_name="events")
    op.drop_index(op.f("ix_events_owner_cluster_id"), table_name="events")
    op.drop_table("events")
    op.drop_index(op.f("ix_discussions_owner_cluster_id"), table_name="discussions")
    op.drop_index(op.f("ix_discussions_creator_user_id"), table_name="discussions")
    op.drop_table("discussions")
    op.drop_index(op.f("ix_cluster_subscriptions_user_id"), table_name="cluster_subscriptions")
    op.drop_index(op.f("ix_cluster_subscriptions_cluster_id"), table_name="cluster_subscriptions")
    op.drop_table("cluster_subscriptions")
    op.drop_index(op.f("ix_sessions_user_id"), table_name="sessions")
    op.drop_table("sessions")
    op.drop_index(op.f("ix_password_reset_tokens_user_id"), table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
    op.drop_index(op.f("ix_messages_target_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_conversation_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_author_id"), table_name="messages")
    op.drop_table("messages")
    op.drop_index(op.f("ix_login_tokens_user_id"), table_name="login_tokens")
    op.drop_table("login_tokens")
    op.drop_index(op.f("ix_initiated_uploads_initiator_user_id"), table_name="initiated_uploads")
    op.drop_table("initiated_uploads")
    op.drop_index(op.f("ix_host_requests_to_user_id"), table_name="host_requests")
    op.drop_index(op.f("ix_host_requests_from_user_id"), table_name="host_requests")
    op.drop_table("host_requests")
    op.drop_index(op.f("ix_group_chats_creator_id"), table_name="group_chats")
    op.drop_table("group_chats")
    op.drop_index(op.f("ix_friend_relationships_to_user_id"), table_name="friend_relationships")
    op.drop_index(op.f("ix_friend_relationships_from_user_id"), table_name="friend_relationships")
    op.drop_table("friend_relationships")
    op.drop_index(op.f("ix_complaints_reported_user_id"), table_name="complaints")
    op.drop_index(op.f("ix_complaints_author_user_id"), table_name="complaints")
    op.drop_table("complaints")
    op.drop_index(op.f("ix_comments_thread_id"), table_name="comments")
    op.drop_table("comments")
    op.drop_index(op.f("ix_clusters_parent_node_id"), table_name="clusters")
    op.drop_index("ix_clusters_owner_parent_node_id_is_official_cluster", table_name="clusters")
    op.drop_table("clusters")
    op.drop_table("users")
    op.drop_index(op.f("ix_uploads_creator_user_id"), table_name="uploads")
    op.drop_table("uploads")
    op.drop_table("threads")
    op.drop_table("signup_tokens")
    op.drop_index(op.f("ix_nodes_parent_node_id"), table_name="nodes")
    op.drop_table("nodes")
    op.drop_table("emails")
    op.drop_table("conversations")
    op.drop_table("background_jobs")
    op.execute("DROP FUNCTION slugify")
    op.execute("DROP EXTENSION unaccent")
    op.execute("DROP EXTENSION pg_trgm")
