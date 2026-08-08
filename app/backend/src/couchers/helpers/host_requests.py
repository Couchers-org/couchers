"""
Shared host request helpers.

The role-based party predicates below exist because a host request has a fixed direction
(initiator -> recipient), but the *stay-role* of each party depends on how the request came about:

  - a normal request: the initiator is the surfer, the recipient is the host
  - a public-trip offer: the roles are reversed — the initiator is offering their couch, so they are
    the host, and the recipient (the trip owner) is the surfer

So "am I hosting?" is not the same question as "did I receive this?".
"""

from sqlalchemy.sql import and_, case, exists, or_, select
from sqlalchemy.sql.elements import ColumnElement

from couchers.models import HostRequest, Message
from couchers.models.notifications import NotificationTopicAction

# topic actions whose notifications are marked seen alongside a host request being read
HOST_REQUEST_NOTIFICATION_TOPIC_ACTIONS = [
    NotificationTopicAction.host_request__create,
    NotificationTopicAction.host_request__accept,
    NotificationTopicAction.host_request__reject,
    NotificationTopicAction.host_request__confirm,
    NotificationTopicAction.host_request__cancel,
    NotificationTopicAction.host_request__message,
    NotificationTopicAction.host_request__missed_messages,
    NotificationTopicAction.host_request__reminder,
]


def is_hosting_party(user_id: int) -> ColumnElement[bool]:
    """The viewer is the host of the stay: a normal request they received, or an offer they sent."""
    return or_(
        and_(HostRequest.public_trip_id.is_(None), HostRequest.recipient_user_id == user_id),
        and_(HostRequest.public_trip_id.isnot(None), HostRequest.initiator_user_id == user_id),
    )


def is_surfing_party(user_id: int) -> ColumnElement[bool]:
    """The viewer is the guest of the stay: a normal request they sent, or an offer they received."""
    return or_(
        and_(HostRequest.public_trip_id.is_(None), HostRequest.initiator_user_id == user_id),
        and_(HostRequest.public_trip_id.isnot(None), HostRequest.recipient_user_id == user_id),
    )


def is_public_trip_offer_recipient(user_id: int) -> ColumnElement[bool]:
    """
    An offer on one of the viewer's public trips: they own the trip, so they received the offer.
    A strict subset of is_surfing_party.
    """
    return and_(HostRequest.public_trip_id.isnot(None), HostRequest.recipient_user_id == user_id)


def viewer_last_seen_message_id(user_id: int) -> ColumnElement[int]:
    """The viewer's last-seen message id on a request, whichever side of it they are on."""
    return case(
        (HostRequest.initiator_user_id == user_id, HostRequest.initiator_last_seen_message_id),
        else_=HostRequest.recipient_last_seen_message_id,
    )


def has_unseen_host_request_messages(user_id: int) -> ColumnElement[bool]:
    """
    A request carrying at least one message the viewer hasn't seen. This is what the Ping badge
    counts, so anything clearing the badge has to agree with it.
    """
    return exists(
        select(1)
        .where(Message.conversation_id == HostRequest.conversation_id)
        .where(Message.id > viewer_last_seen_message_id(user_id))
    )
