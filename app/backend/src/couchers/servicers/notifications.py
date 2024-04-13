from couchers.db import session_scope
from couchers.models import Notification, User
from couchers.sql import couchers_select as select
from couchers.utils import Timestamp_from_datetime
from proto import notifications_pb2, notifications_pb2_grpc

MAX_PAGINATION_LENGTH = 100


def notification_to_pb(notification: Notification):
    return notifications_pb2.Notification(
        notification_id=notification.id,
        created=Timestamp_from_datetime(notification.created),
        topic=notification.topic_action.topic,
        action=notification.topic_action.action,
        key=notification.key,
        avatar_key=notification.avatar_key,
        icon=notification.icon,
        title=notification.title,
        content=notification.content,
        link=notification.link,
    )


class Notifications(notifications_pb2_grpc.NotificationsServicer):
    def GetNotificationSettings(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return notifications_pb2.GetNotificationSettingsRes(
                new_notifications_enabled=user.new_notifications_enabled
            )

    def SetNotificationSettings(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            user.new_notifications_enabled = request.enable_new_notifications
        return notifications_pb2.SetNotificationSettingsRes()

    def ListNotifications(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_notification_id = int(request.page_token) if request.page_token else 2**50
            notifications = (
                session.execute(
                    select(Notification)
                    .where(Notification.user_id == context.user_id)
                    .where(Notification.id <= next_notification_id)
                    .order_by(Notification.id.desc())
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return notifications_pb2.ListNotificationsRes(
                notifications=[notification_to_pb(notification) for notification in notifications[:page_size]],
                next_page_token=str(notifications[-1].id) if len(notifications) > page_size else None,
            )
