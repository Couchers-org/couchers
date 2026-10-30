"""
Runner for the User-targeted email campaigns registered in couchers.email_campaigns.
"""

import logging

from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import session_scope
from couchers.email_campaigns import CAMPAIGNS
from couchers.experimentation_sql import check_value_against_sdk, feature_value_sql, record_sql_exposures
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
        flag = feature_value_sql(campaign.flag_key, campaign.flag_default, User.id)
        with session_scope() as session:
            already_sent = (
                select(UserEmailCampaignSend.user_id)
                .where(UserEmailCampaignSend.campaign_key == campaign.key)
                .scalar_subquery()
            )
            candidates = campaign.predicate().where(~User.id.in_(already_sent))
            record_sql_exposures(session, flag, candidates, campaign.sends)
            recipients = session.execute(candidates.add_columns(flag.value).where(campaign.sends(flag.value))).all()
            for user, value in recipients:
                check_value_against_sdk(flag, user.id, value)
                notify(
                    session,
                    user_id=user.id,
                    topic_action=NotificationTopicAction.campaign__nudge,
                    key=campaign.key,
                )
                session.add(UserEmailCampaignSend(user_id=user.id, campaign_key=campaign.key))
                session.commit()
