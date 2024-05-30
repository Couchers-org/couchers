from couchers.models import HostRequest, User
from couchers.utils import date_to_api
from proto.internal import notification_data_pb2


def make_host_request_info(host_request: HostRequest):
    return notification_data_pb2.HostRequestInfo(
        host_request_id=host_request.conversation_id,
        from_date=date_to_api(host_request.from_date),
        to_date=date_to_api(host_request.to_date),
    )


def make_user_info(user: User):
    return notification_data_pb2.UserInfo(
        user_id=user.id,
        avatar_url=user.avatar.thumbnail_url if user.avatar else None,
        name=user.name,
        age=user.age,
        location=user.city,
    )
