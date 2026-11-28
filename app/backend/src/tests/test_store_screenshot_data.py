from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.helpers.completed_profile import has_completed_profile
from couchers.jobs.handlers import check_database_consistency
from couchers.models import (
    Cluster,
    ClusterSubscription,
    Comment,
    EventOccurrence,
    HostRequest,
    HostRequestStatus,
    ModerationState,
    ModerationVisibility,
    User,
)
from couchers.resources import copy_resources_to_database
from couchers.utils import now, today
from dummy_data import add_dummy_data
from store_screenshot_data import add_store_screenshot_data


def test_add_store_screenshot_data(db, fast_passwords):
    with session_scope() as session:
        copy_resources_to_database(session)
    add_dummy_data()

    add_store_screenshot_data({})
    # re-running must not duplicate anything or fail, and applies display name overrides
    add_store_screenshot_data({"ines_s": "Ana"})

    check_database_consistency(empty_pb2.Empty())

    with session_scope() as session:
        users = session.execute(select(User).where(User.email.like("%@screenshots.couchers.invalid"))).scalars().all()
        assert len(users) == 17
        assert all(has_completed_profile(session, user) for user in users)
        assert {user.name for user in users if user.username == "ines_s"} == {"Ana"}

        upcoming = session.execute(select(HostRequest).where(HostRequest.from_date > today())).scalars().all()
        assert len(upcoming) == 4
        assert all(host_request.status == HostRequestStatus.confirmed for host_request in upcoming)

        occurrences = session.execute(select(EventOccurrence).where(~EventOccurrence.is_deleted)).scalars().all()
        assert len(occurrences) == 7
        assert all(occurrence.start_time > now() for occurrence in occurrences)
        assert all(occurrence.photo_key for occurrence in occurrences)

        # the demo user lives in the seeded Carlton community
        maya = session.execute(select(User).where(User.username == "maya_r")).scalar_one()
        maya_communities = session.execute(
            select(Cluster.name)
            .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
            .where(ClusterSubscription.user_id == maya.id)
        ).scalars()
        assert "Carlton" in set(maya_communities)

        # the community's discussions have replies, and re-running didn't duplicate them
        assert len(session.execute(select(Comment)).scalars().all()) == 9

        assert not session.execute(
            select(ModerationState).where(ModerationState.visibility == ModerationVisibility.shadowed)
        ).first()
