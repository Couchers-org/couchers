"""
Registry of User-targeted email campaigns: one-off nudges gated by SQL predicates.

Each campaign declares:
  - a SQL predicate over User (the candidate set);
  - the email to send, and the URL its push variant deep-links to;
  - optionally, a per-user filter run in Python (used for things that need a per-user
    CouchersContext, e.g. feature-flag evaluation that picks a per-user window).

All campaigns share the single `campaign__nudge` topic-action, keyed by the campaign key, so
one unsubscribe covers every campaign rather than one toggle per campaign.

Sends are deduped via the `user_email_campaign_sends` table: a campaign is sent to a user at
most once for a given campaign_key. Multi-stage campaigns (e.g. onboarding 1 -> 2) are
expressed as separate campaigns whose predicate references the previous stage via an EXISTS
against this table.
"""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import timedelta
from typing import Protocol

from sqlalchemy import Select, select

from couchers import urls
from couchers.context import CouchersContext
from couchers.email import emails
from couchers.email.blocks import EmailBase
from couchers.models import HostingStatus, User
from couchers.utils import now


class CampaignEmail(Protocol):
    """A campaign email is constructible from just the recipient's name."""

    def __call__(self, *, user_name: str) -> EmailBase: ...


@dataclass(frozen=True, kw_only=True)
class EmailCampaign:
    key: str
    email: CampaignEmail
    action_url: Callable[[], str]
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


CAMPAIGNS: list[EmailCampaign] = [
    EmailCampaign(
        key="host_my_home_nudge",
        email=emails.HostMyHomeNudgeEmail,
        action_url=urls.edit_home_link,
        predicate=_host_my_home_nudge_predicate,
        per_user_filter=_host_my_home_nudge_per_user,
    ),
]

CAMPAIGNS_BY_KEY = {campaign.key: campaign for campaign in CAMPAIGNS}


def get_campaign(key: str) -> EmailCampaign:
    campaign = CAMPAIGNS_BY_KEY.get(key)
    if campaign is None:
        raise NotImplementedError(f"No email campaign registered under {key}.")
    return campaign
