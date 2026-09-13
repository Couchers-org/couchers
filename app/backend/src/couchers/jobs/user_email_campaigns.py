"""
Runner for the User-targeted email campaigns registered in couchers.email_campaigns.
"""

import logging

from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.context import make_background_user_context
from couchers.db import session_scope
from couchers.email_campaigns import CAMPAIGNS
from couchers.models import (
    NotificationTopicAction,
    User,
    UserEmailCampaignSend,
)
from couchers.notifications.notify import notify

logger = logging.getLogger(__name__)


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
                    topic_action=NotificationTopicAction.campaign__nudge,
                    key=campaign.key,
                )
                session.add(UserEmailCampaignSend(user_id=user.id, campaign_key=campaign.key))
                session.commit()
