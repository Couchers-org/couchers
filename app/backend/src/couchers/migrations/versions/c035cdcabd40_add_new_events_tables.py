"""Add new events tables

Revision ID: c035cdcabd40
Revises: 55638524a932
Create Date: 2021-03-29 13:05:52.081028

"""
import geoalchemy2
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import TSTZRANGE, ExcludeConstraint

# revision identifiers, used by Alembic.
revision = "c035cdcabd40"
down_revision = "55638524a932"
branch_labels = None
depends_on = None


def upgrade():
    # required for gist-based exclusion constraints
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.create_table(
        "events",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("parent_node_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("owner_user_id", sa.BigInteger(), nullable=True),
        sa.Column("owner_cluster_id", sa.BigInteger(), nullable=True),
        sa.Column("thread_id", sa.BigInteger(), nullable=False),
        sa.CheckConstraint(
            "(owner_user_id IS NULL AND owner_cluster_id IS NOT NULL) OR (owner_user_id IS NOT NULL AND owner_cluster_id IS NULL)",
            name=op.f("ck_events_one_owner"),
        ),
        sa.ForeignKeyConstraint(["creator_user_id"], ["users.id"], name=op.f("fk_events_creator_user_id_users")),
        sa.ForeignKeyConstraint(
            ["owner_cluster_id"], ["clusters.id"], name=op.f("fk_events_owner_cluster_id_clusters")
        ),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], name=op.f("fk_events_owner_user_id_users")),
        sa.ForeignKeyConstraint(["parent_node_id"], ["nodes.id"], name=op.f("fk_events_parent_node_id_nodes")),
        sa.ForeignKeyConstraint(["thread_id"], ["threads.id"], name=op.f("fk_events_thread_id_threads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_events")),
        sa.UniqueConstraint("thread_id", name=op.f("uq_events_thread_id")),
    )
    op.create_index(op.f("ix_events_creator_user_id"), "events", ["creator_user_id"], unique=False)
    op.create_index(op.f("ix_events_owner_cluster_id"), "events", ["owner_cluster_id"], unique=False)
    op.create_index(op.f("ix_events_owner_user_id"), "events", ["owner_user_id"], unique=False)
    op.create_index(op.f("ix_events_parent_node_id"), "events", ["parent_node_id"], unique=False)
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
        "event_occurences",
        sa.Column("id", sa.BigInteger(), server_default=sa.text("nextval('communities_seq')"), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("creator_user_id", sa.BigInteger(), nullable=False),
        sa.Column("content", sa.String(), nullable=False),
        sa.Column("photo_key", sa.String(), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326, from_text="ST_GeomFromEWKT", name="geometry"),
            nullable=True,
        ),
        sa.Column("address", sa.String(), nullable=True),
        sa.Column("link", sa.String(), nullable=True),
        sa.Column("during", TSTZRANGE, nullable=False),
        sa.Column("created", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_edited", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["creator_user_id"], ["users.id"], name=op.f("fk_event_occurences_creator_user_id_users")
        ),
        sa.CheckConstraint(
            "(geom IS NULL AND address IS NULL) OR (geom IS NOT NULL AND address IS NOT NULL)",
            name=op.f("ck_event_occurences_geom_iff_address"),
        ),
        sa.CheckConstraint(
            "(geom IS NULL AND link IS NOT NULL) OR (geom IS NOT NULL AND link IS NULL)",
            name=op.f("ck_event_occurences_link_or_geom"),
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("fk_event_occurences_event_id_events")),
        sa.ForeignKeyConstraint(["photo_key"], ["uploads.key"], name=op.f("fk_event_occurences_photo_key_uploads")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_occurences")),
        ExcludeConstraint(("event_id", "="), ("during", "&&"), name="event_occurences_event_id_during_excl"),
    )
    op.create_index(op.f("ix_event_occurences_event_id"), "event_occurences", ["event_id"], unique=False)
    op.create_index(op.f("ix_event_occurences_creator_user_id"), "event_occurences", ["creator_user_id"], unique=False)
    op.create_table(
        "event_organizers",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("event_id", sa.BigInteger(), nullable=False),
        sa.Column("joined", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], name=op.f("fk_event_organizers_event_id_events")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_event_organizers_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_organizers")),
        sa.UniqueConstraint("event_id", "user_id", name=op.f("uq_event_organizers_event_id")),
    )
    op.create_index(op.f("ix_event_organizers_event_id"), "event_organizers", ["event_id"], unique=False)
    op.create_index(op.f("ix_event_organizers_user_id"), "event_organizers", ["user_id"], unique=False)
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
        "event_occurence_attendees",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("occurence_id", sa.BigInteger(), nullable=False),
        sa.Column("responded", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("attendee_status", sa.Enum("going", "maybe", name="attendeestatus"), nullable=False),
        sa.ForeignKeyConstraint(
            ["occurence_id"],
            ["event_occurences.id"],
            name=op.f("fk_event_occurence_attendees_occurence_id_event_occurences"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_event_occurence_attendees_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_event_occurence_attendees")),
        sa.UniqueConstraint("occurence_id", "user_id", name=op.f("uq_event_occurence_attendees_occurence_id")),
    )
    op.create_index(
        op.f("ix_event_occurence_attendees_occurence_id"), "event_occurence_attendees", ["occurence_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_occurence_attendees_user_id"), "event_occurence_attendees", ["user_id"], unique=False
    )
    op.create_check_constraint(
        "geom_iff_address",
        "page_versions",
        "(geom IS NULL AND address IS NULL) OR (geom IS NOT NULL AND address IS NOT NULL)",
    )


def downgrade():
    op.drop_index(op.f("ix_event_occurence_attendees_user_id"), table_name="event_occurence_attendees")
    op.drop_index(op.f("ix_event_occurence_attendees_occurence_id"), table_name="event_occurence_attendees")
    op.drop_table("event_occurence_attendees")
    op.drop_index(op.f("ix_event_subscriptions_user_id"), table_name="event_subscriptions")
    op.drop_index(op.f("ix_event_subscriptions_event_id"), table_name="event_subscriptions")
    op.drop_table("event_subscriptions")
    op.drop_index(op.f("ix_event_organizers_user_id"), table_name="event_organizers")
    op.drop_index(op.f("ix_event_organizers_event_id"), table_name="event_organizers")
    op.drop_table("event_organizers")
    op.drop_index(op.f("ix_event_occurences_event_id"), table_name="event_occurences")
    op.drop_table("event_occurences")
    op.drop_index(op.f("ix_cluster_event_associations_event_id"), table_name="cluster_event_associations")
    op.drop_index(op.f("ix_cluster_event_associations_cluster_id"), table_name="cluster_event_associations")
    op.drop_table("cluster_event_associations")
    op.drop_index(op.f("ix_events_parent_node_id"), table_name="events")
    op.drop_index(op.f("ix_events_owner_user_id"), table_name="events")
    op.drop_index(op.f("ix_events_owner_cluster_id"), table_name="events")
    op.drop_index(op.f("ix_events_creator_user_id"), table_name="events")
    op.drop_table("events")
