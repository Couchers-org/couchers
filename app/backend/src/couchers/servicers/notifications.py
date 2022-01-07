import grpc

from couchers.db import session_scope
from couchers.models import User
from couchers.sql import couchers_select as select
from proto import notifications_pb2, notifications_pb2_grpc


class Notifications(notifications_pb2_grpc.NotificationsServicer):
    def GetNewNotificationsEnabled(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            return notifications_pb2.GetNewNotificationsEnabledRes(
                new_notifications_enabled=user.new_notifications_enabled
            )

    def SetNewNotificationsEnabled(self, request, context):
        with session_scope() as session:
            user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
            user.new_notifications_enabled = request.enable_new_notifications
            session.commit()
            return notifications_pb2.SetNewNotificationsEnabledRes(
                new_notifications_enabled=user.new_notifications_enabled
            )
