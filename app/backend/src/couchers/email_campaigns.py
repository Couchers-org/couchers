"""
Registry of User-targeted email campaigns: one-off nudges gated by SQL predicates.

Each campaign declares:
  - a SQL predicate over User (the candidate set);
  - the email to send, and the URL its push variant deep-links to;
  - a GrowthBook flag, and which candidates get emailed under a given value of it. The flag is
    evaluated in SQL (see couchers.experimentation_sql), so an experiment on it A/B tests the email:
    candidates the email would go to under any arm are logged as exposed, in every arm.

All campaigns share the single `campaign__nudge` topic-action, keyed by the campaign key, so
one unsubscribe covers every campaign rather than one toggle per campaign.

Sends are deduped via the `user_email_campaign_sends` table: a campaign is sent to a user at
most once for a given campaign_key. Multi-stage campaigns (e.g. onboarding 1 -> 2) are
expressed as separate campaigns whose predicate references the previous stage via an EXISTS
against this table.
"""

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any, Protocol

from sqlalchemy import ColumnElement, Interval, Select, and_, func, literal_column, select

from couchers import urls
from couchers.email import emails
from couchers.email.blocks import EmailBase
from couchers.models import HostingStatus, User


class CampaignEmail(Protocol):
    """A campaign email is constructible from just the recipient's name."""

    def __call__(self, *, user_name: str) -> EmailBase: ...


@dataclass(frozen=True, kw_only=True)
class EmailCampaign:
    key: str
    email: CampaignEmail
    action_url: Callable[[], str]
    predicate: Callable[[], Select[tuple[User]]]
    flag_key: str
    flag_default: Any
    # whether a candidate is emailed under the given flag value. Must not depend on anything the email itself
    # changes, or control and treatment users would stop being comparable.
    sends: Callable[[ColumnElement[Any]], ColumnElement[bool]]


def _host_my_home_nudge_predicate() -> Select[tuple[User]]:
    # Candidate set: visible hosts (or maybe-hosts) who finished the onboarding nudge track
    # but still haven't filled out "My Home".
    return (
        select(User)
        .where(User.is_visible)
        .where(User.hosting_status.in_([HostingStatus.can_host, HostingStatus.maybe]))
        .where(User.onboarding_emails_sent >= 2)
        .where(~User.has_completed_my_home)
    )


def _host_my_home_nudge_sends(days: ColumnElement[Any]) -> ColumnElement[bool]:
    # Flag value is the days-since-signup at which we start nudging this user. -1 disables.
    day = literal_column("interval '1 day'", Interval)
    age = func.now() - User.joined
    return and_(days >= 0, age >= day * days, age <= day * (days + 60))


CAMPAIGNS: list[EmailCampaign] = [
    EmailCampaign(
        key="host_my_home_nudge",
        email=emails.HostMyHomeNudgeEmail,
        action_url=urls.edit_home_link,
        predicate=_host_my_home_nudge_predicate,
        flag_key="host_my_home_nudge_days_after_signup",
        flag_default=-1,
        sends=_host_my_home_nudge_sends,
    ),
]

CAMPAIGNS_BY_KEY = {campaign.key: campaign for campaign in CAMPAIGNS}


def get_campaign(key: str) -> EmailCampaign:
    campaign = CAMPAIGNS_BY_KEY.get(key)
    if campaign is None:
        raise NotImplementedError(f"No email campaign registered under {key}.")
    return campaign
