"""
A small engine for sending User-targeted email campaigns based on per-user predicates.

Each campaign declares:
  - a SQL predicate over User (the candidate set);
  - optionally, a per-user filter run in Python (used for things that need a per-user
    CouchersContext, e.g. feature-flag evaluation that picks a per-user window).

The engine dedups via the `user_email_campaign_sends` table: a campaign is sent to a user at
most once for a given campaign_key. Multi-stage campaigns (e.g. onboarding 1 -> 2) are
expressed as separate campaigns whose predicate references the previous stage via an EXISTS
against this table.
"""

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import timedelta

from google.protobuf import empty_pb2
from sqlalchemy import Select, select

from couchers.context import CouchersContext, make_background_user_context
from couchers.db import session_scope
from couchers.models import (
    HostingStatus,
    NotificationTopicAction,
    User,
    UserEmailCampaignSend,
)
from couchers.notifications.notify import notify
from couchers.utils import now

logger = logging.getLogger(__name__)


@dataclass(frozen=True, kw_only=True)
class UserEmailCampaign:
    key: str
    topic_action: NotificationTopicAction
    predicate: Callable[[], Select[tuple[User]]]
    per_user_filter: Callable[[CouchersContext, User], bool] | None = None


def _host_my_home_nudge_predicate() -> Select[tuple[User]]:
    # Candidate set: visible hosts (or maybe-hosts) who finished the onboarding nudge track
    # but still haven't filled out "My Home". Final signup-window check is per-user (depends on
    # a GrowthBook integer flag) and lives in the per_user_filter below.
    return (
        select(User)
        .where(User.is_visible)
        .where(User.hosting_status.in_([HostingStatus.can_host, HostingStatus.maybe]))
        .where(User.onboarding_emails_sent >= 2)
        .where(~User.has_completed_my_home)
    )


def _host_my_home_nudge_per_user(context: CouchersContext, user: User) -> bool:
    # Flag value is the days-since-signup at which we start nudging this user. -1 disables.
    days = context.get_integer_value("host_my_home_nudge_days_after_signup", -1)
    if days < 0:
        return False
    age = now() - user.joined
    return timedelta(days=days) <= age <= timedelta(days=days + 60)


CAMPAIGNS: list[UserEmailCampaign] = [
    UserEmailCampaign(
        key="host_my_home_nudge",
        topic_action=NotificationTopicAction.host_my_home__nudge,
        predicate=_host_my_home_nudge_predicate,
        per_user_filter=_host_my_home_nudge_per_user,
    ),
]


def run_user_email_campaigns(payload: empty_pb2.Empty) -> None:
    """Hourly: walk each campaign, send to newly-eligible users, record the send."""
    for campaign in CAMPAIGNS:
        logger.info("Running user email campaign %s", campaign.key)
        with session_scope() as session:
            already_sent = (
                select(UserEmailCampaignSend.user_id)
                .where(UserEmailCampaignSend.campaign_key == campaign.key)
                .scalar_subquery()
            )
            candidates = session.execute(campaign.predicate().where(~User.id.in_(already_sent))).scalars().all()
            for user in candidates:
                if campaign.per_user_filter is not None:
                    context = make_background_user_context(user_id=user.id)
                    if not campaign.per_user_filter(context, user):
                        continue
                notify(
                    session,
                    user_id=user.id,
                    topic_action=campaign.topic_action,
                    key=campaign.key,
                )
                session.add(UserEmailCampaignSend(user_id=user.id, campaign_key=campaign.key))
                session.commit()
