import logging
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta
from urllib.parse import urlencode

import grpc
from couchers import errors
from couchers.config import config
from couchers.crypto import generate_hash_signature, random_hex
from couchers.db import (get_friends_status, get_user_by_field, is_valid_color,
                         is_valid_name, session_scope)
from couchers.models import (Complaint, FriendRelationship, FriendStatus,
                             HostingStatus, HostRequest, InitiatedUpload,
                             Message, Reference, ReferenceType,
                             SmokingLocation, User)
from couchers.tasks import send_report_email
from couchers.utils import Timestamp_from_datetime
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp
from pb import api_pb2, api_pb2_grpc, media_pb2
from sqlalchemy.sql import or_

reftype2sql = {
    api_pb2.ReferenceType.FRIEND: ReferenceType.FRIEND,
    api_pb2.ReferenceType.SURFED: ReferenceType.SURFED,
    api_pb2.ReferenceType.HOSTED: ReferenceType.HOSTED,
}

reftype2api = {
    ReferenceType.FRIEND: api_pb2.ReferenceType.FRIEND,
    ReferenceType.SURFED: api_pb2.ReferenceType.SURFED,
    ReferenceType.HOSTED: api_pb2.ReferenceType.HOSTED,
}

hostingstatus2sql = {
    api_pb2.HOSTING_STATUS_UNKNOWN: None,
    api_pb2.HOSTING_STATUS_CAN_HOST: HostingStatus.can_host,
    api_pb2.HOSTING_STATUS_MAYBE: HostingStatus.maybe,
    api_pb2.HOSTING_STATUS_DIFFICULT: HostingStatus.difficult,
    api_pb2.HOSTING_STATUS_CANT_HOST: HostingStatus.cant_host,
}

hostingstatus2api = {
    None: api_pb2.HOSTING_STATUS_UNKNOWN,
    HostingStatus.can_host: api_pb2.HOSTING_STATUS_CAN_HOST,
    HostingStatus.maybe: api_pb2.HOSTING_STATUS_MAYBE,
    HostingStatus.difficult: api_pb2.HOSTING_STATUS_DIFFICULT,
    HostingStatus.cant_host: api_pb2.HOSTING_STATUS_CANT_HOST,
}

smokinglocation2sql = {
    api_pb2.SMOKING_LOCATION_UNKNOWN: None,
    api_pb2.SMOKING_LOCATION_YES: SmokingLocation.yes,
    api_pb2.SMOKING_LOCATION_WINDOW: SmokingLocation.window,
    api_pb2.SMOKING_LOCATION_OUTSIDE: SmokingLocation.outside,
    api_pb2.SMOKING_LOCATION_NO: SmokingLocation.no,
}

smokinglocation2api = {
    None: api_pb2.SMOKING_LOCATION_UNKNOWN,
    SmokingLocation.yes: api_pb2.SMOKING_LOCATION_YES,
    SmokingLocation.window: api_pb2.SMOKING_LOCATION_WINDOW,
    SmokingLocation.outside: api_pb2.SMOKING_LOCATION_OUTSIDE,
    SmokingLocation.no: api_pb2.SMOKING_LOCATION_NO,
}


class API(api_pb2_grpc.APIServicer):
    def __init__(self, Session):
        self._Session = Session

    def update_last_active_time(self, user_id):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == user_id).one()
            user.last_active = datetime.utcnow()

    def Ping(self, request, context):
        with session_scope(self._Session) as session:
            # auth ought to make sure the user exists
            user = session.query(User).filter(User.id == context.user_id).one()

            unseen_host_request_count_1 = (session.query(Message, HostRequest)
                                         .outerjoin(HostRequest, Message.conversation_id == HostRequest.conversation_id)
                                         .filter(HostRequest.from_user_id == context.user_id)
                                         .filter(HostRequest.from_last_seen_message_id < Message.id)
                                         .group_by(Message.conversation_id)
                                         .count())
            unseen_host_request_count_2 = (session.query(Message, HostRequest)
                                         .outerjoin(HostRequest, Message.conversation_id == HostRequest.conversation_id)
                                         .filter(HostRequest.to_user_id == context.user_id)
                                         .filter(HostRequest.to_last_seen_message_id < Message.id)
                                         .group_by(Message.conversation_id)
                                         .count())

            return api_pb2.PingRes(
                user=user_model_to_pb(user, session, context),
                unseen_host_request_count=unseen_host_request_count_1 + unseen_host_request_count_2
            )

    def GetUser(self, request, context):
        with session_scope(self._Session) as session:
            user = get_user_by_field(session, request.user)

            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            return user_model_to_pb(user, session, context)

    def UpdateProfile(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if request.HasField("name"):
                if not is_valid_name(request.name.value):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                                  errors.INVALID_NAME)
                user.name = request.name.value

            if request.HasField("city"):
                user.city = request.city.value

            if request.HasField("gender"):
                user.gender = request.gender.value

            if request.HasField("occupation"):
                if request.occupation.is_null:
                    user.occupation = None
                else:
                    user.occupation = request.occupation.value

            if request.HasField("about_me"):
                if request.about_me.is_null:
                    user.about_me = None
                else:
                    user.about_me = request.about_me.value

            if request.HasField("about_place"):
                if request.about_place.is_null:
                    user.about_place = None
                else:
                    user.about_place = request.about_place.value

            if request.HasField("color"):
                color = request.color.value.lower()
                if not is_valid_color(color):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                                  errors.INVALID_COLOR)
                user.color = color

            if request.hosting_status != api_pb2.HOSTING_STATUS_UNSPECIFIED:
                user.hosting_status = hostingstatus2sql[request.hosting_status]

            if request.languages.exists:
                user.languages = "|".join(request.languages.value)

            if request.countries_visited.exists:
                user.countries_visited = "|".join(
                    request.countries_visited.value)

            if request.countries_lived.exists:
                user.countries_lived = "|".join(request.countries_lived.value)
            
            if request.HasField("max_guests"):
                if request.max_guests.is_null:
                    user.max_guests = None
                else:
                    user.max_guests = request.max_guests.value

            if request.HasField("multiple_groups"):
                if request.multiple_groups.is_null:
                    user.multiple_groups = None
                else:
                    user.multiple_groups = request.multiple_groups.value

            if request.HasField("last_minute"):
                if request.last_minute.is_null:
                    user.last_minute = None
                else:
                    user.last_minute = request.last_minute.value

            if request.HasField("accepts_pets"):
                if request.accepts_pets.is_null:
                    user.accepts_pets = None
                else:
                    user.accepts_pets = request.accepts_pets.value

            if request.HasField("accepts_kids"):
                if request.accepts_kids.is_null:
                    user.accepts_kids = None
                else:
                    user.accepts_kids = request.accepts_kids.value

            if request.HasField("wheelchair_accessible"):
                if request.wheelchair_accessible.is_null:
                    user.wheelchair_accessible = None
                else:
                    user.wheelchair_accessible = request.wheelchair_accessible.value

            if request.smoking_allowed != api_pb2.SMOKING_LOCATION_UNSPECIFIED:
                user.smoking_allowed = smokinglocation2sql[request.smoking_allowed]

            if request.HasField("sleeping_arrangement"):
                if request.sleeping_arrangement.is_null:
                    user.sleeping_arrangement = None
                else:
                    user.sleeping_arrangement = request.sleeping_arrangement.value

            if request.HasField("area"):
                if request.area.is_null:
                    user.area = None
                else:
                    user.area = request.area.value

            if request.HasField("house_rules"):
                if request.house_rules.is_null:
                    user.house_rules = None
                else:
                    user.house_rules = request.house_rules.value

            # save updates
            session.commit()

            return empty_pb2.Empty()

    def ListFriends(self, request, context):
        with session_scope(self._Session) as session:
            rels = (session.query(FriendRelationship)
                    .filter(
                    or_(
                        FriendRelationship.from_user_id == context.user_id,
                        FriendRelationship.to_user_id == context.user_id
                    )
                    )
                    .filter(FriendRelationship.status == FriendStatus.accepted)
                    .all())
            return api_pb2.ListFriendsRes(
                user_ids=[rel.from_user.id if rel.from_user.id !=
                          context.user_id else rel.to_user.id for rel in rels],
            )

    def SendFriendRequest(self, request, context):
        with session_scope(self._Session) as session:
            from_user = session.query(User).filter(
                User.id == context.user_id).one_or_none()

            if not from_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            to_user = session.query(User).filter(
                User.id == request.user_id).one_or_none()

            if not to_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if get_friends_status(session, from_user.id, to_user.id) != api_pb2.User.FriendshipStatus.NOT_FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION,
                              errors.FRIENDS_ALREADY_OR_PENDING)

            # Race condition!

            friend_relationship = FriendRelationship(
                from_user=from_user,
                to_user=to_user,
                status=FriendStatus.pending,
            )
            session.add(friend_relationship)

            return empty_pb2.Empty()

    def ListFriendRequests(self, request, context):
        # both sent and received
        with session_scope(self._Session) as session:
            sent_requests = (session.query(FriendRelationship)
                             .filter(FriendRelationship.from_user_id == context.user_id)
                             .filter(FriendRelationship.status == FriendStatus.pending)
                             .all())

            received_requests = (session.query(FriendRelationship)
                                 .filter(FriendRelationship.to_user_id == context.user_id)
                                 .filter(FriendRelationship.status == FriendStatus.pending)
                                 .all())

            return api_pb2.ListFriendRequestsRes(
                sent=[
                    api_pb2.FriendRequest(
                        friend_request_id=friend_request.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_request.to_user.id,
                    ) for friend_request in sent_requests
                ],
                received=[
                    api_pb2.FriendRequest(
                        friend_request_id=friend_request.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_request.from_user.id,
                    ) for friend_request in received_requests
                ]
            )

    def RespondFriendRequest(self, request, context):
        with session_scope(self._Session) as session:
            friend_request = (session.query(FriendRelationship)
                              .filter(FriendRelationship.to_user_id == context.user_id)
                              .filter(FriendRelationship.status == FriendStatus.pending)
                              .filter(FriendRelationship.id == request.friend_request_id)
                              .one_or_none())

            if not friend_request:
                context.abort(grpc.StatusCode.NOT_FOUND,
                              errors.FRIEND_REQUEST_NOT_FOUND)

            friend_request.status = FriendStatus.accepted if request.accept else FriendStatus.rejected
            friend_request.time_responded = datetime.utcnow()

            session.commit()

            return empty_pb2.Empty()

    def CancelFriendRequest(self, request, context):
        with session_scope(self._Session) as session:
            friend_request = (session.query(FriendRelationship)
                              .filter(FriendRelationship.from_user_id == context.user_id)
                              .filter(FriendRelationship.status == FriendStatus.pending)
                              .filter(FriendRelationship.id == request.friend_request_id)
                              .one_or_none())

            if not friend_request:
                context.abort(grpc.StatusCode.NOT_FOUND,
                              errors.FRIEND_REQUEST_NOT_FOUND)

            friend_request.status = FriendStatus.cancelled
            friend_request.time_responded = datetime.utcnow()

            session.commit()

            return empty_pb2.Empty()

    def Search(self, request, context):
        with session_scope(self._Session) as session:
            users = []
            for user in session.query(User) \
                .filter(
                or_(
                    User.name.ilike(f"%{request.query}%"),
                    User.username.ilike(f"%{request.query}%"),
                )
            ) \
                    .all():
                users.append(
                    user_model_to_pb(user, session, context)
                )

            return api_pb2.SearchRes(users=users)

    def Report(self, request, context):
        if context.user_id == request.reported_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          errors.CANT_REPORT_SELF)

        message = Complaint(
            author_user_id=context.user_id,
            reported_user_id=request.reported_user_id,
            reason=request.reason,
            description=request.description,
        )
        with session_scope(self._Session) as session:
            reported_user = session.query(User).filter(User.id == request.reported_user_id).one_or_none()
            if not reported_user:
                context.abort(grpc.StatusCode.NOT_FOUND,
                              errors.USER_NOT_FOUND)
            session.add(message)
        
            reporting_user = session.query(User).filter(User.id == context.user_id).one()

            send_report_email(reporting_user, reported_user,
                            request.reason, request.description)

            return empty_pb2.Empty()

    def WriteReference(self, request, context):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Can't refer yourself")

        reference = Reference(
            from_user_id=context.user_id,
            to_user_id=request.to_user_id,
            reference_type=reftype2sql[request.reference_type],
            text=request.text,
            was_safe=request.was_safe,
            rating=request.rating)
        with session_scope(self._Session) as session:
            if not session.query(User).filter(User.id == request.to_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND,
                              "User not found")

            if (session.query(Reference)
                .filter(Reference.from_user_id == context.user_id)
                .filter(Reference.to_user_id == request.to_user_id)
                .filter(Reference.reference_type == reftype2sql[request.reference_type])
                    .one_or_none()):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION,
                              "Reference already given")
            session.add(reference)
        return empty_pb2.Empty()

    def GetGivenReferences(self, request, context):
        with session_scope(self._Session) as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id ==
                                 request.from_user_id)
            if request.HasField("type_filter"):
                query = query.filter(
                    Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def GetReceivedReferences(self, request, context):
        with session_scope(self._Session) as session:
            query = session.query(Reference)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            if request.HasField("type_filter"):
                query = query.filter(
                    Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def AvailableWriteReferenceTypes(self, request, context):
        available = {
            ReferenceType.FRIEND,
            ReferenceType.SURFED,
            ReferenceType.HOSTED,
        }

        # Filter out already written ones.
        with session_scope(self._Session) as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id == context.user_id)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            for reference in query.all():
                available.remove(reference.reference_type)

        # TODO: make surfing/hosted only available if you actually have been surfing/hosting
        return api_pb2.AvailableWriteReferenceTypesRes(
            reference_types=[reftype2api[r] for r in available])

    def InitiateMediaUpload(self, request, context):
        key = random_hex()

        now = datetime.utcnow()
        expiry = now + timedelta(minutes=20)

        with session_scope(self._Session) as session:
            upload = InitiatedUpload(
                key=key,
                created=now,
                expiry=expiry,
                user_id=context.user_id,
            )
            session.add(upload)
            session.commit()

            req = media_pb2.UploadRequest(
                key=upload.key,
                type=media_pb2.UploadRequest.UploadType.IMAGE,
                created=Timestamp_from_datetime(upload.created),
                expiry=Timestamp_from_datetime(upload.expiry),
                max_width=2000,
                max_height=1600,
            ).SerializeToString()

        data = urlsafe_b64encode(req).decode("utf8")
        sig = urlsafe_b64encode(generate_hash_signature(req, config["MEDIA_SERVER_SECRET_KEY"])).decode("utf8")

        path = "upload?" + urlencode({"data": data, "sig": sig})

        return api_pb2.InitiateMediaUploadRes(
            upload_url=f"{config['MEDIA_SERVER_BASE_URL']}/{path}",
            expiry=Timestamp_from_datetime(expiry),
        )


def paginate_references_result(request, query):
    total_matches = query.count()
    references = query.order_by(Reference.time).offset(
        request.start_at).limit(request.number).all()
    # order by time, pagination
    return api_pb2.GetReferencesRes(
        total_matches=total_matches,
        references=[
            api_pb2.Reference(
                from_user_id=reference.from_user_id,
                to_user_id=reference.to_user_id,
                reference_type=reftype2api[reference.reference_type],
                text=reference.text,
                # Fuzz reference written time
                written_time=Timestamp_from_datetime(
                    reference.time.replace(hour=0, minute=0, second=0, microsecond=0)))
            for reference in references])

def user_model_to_pb(db_user, session, context):
    num_references = session.query(Reference.from_user_id).filter(
            Reference.to_user_id == db_user.id).count()

    user = api_pb2.User(
        user_id=db_user.id,
        username=db_user.username,
        name=db_user.name,
        city=db_user.city,
        verification=db_user.verification,
        community_standing=db_user.community_standing,
        num_references=num_references,
        gender=db_user.gender,
        age=db_user.age,
        color=db_user.color,
        joined=Timestamp_from_datetime(db_user.display_joined),
        last_active=Timestamp_from_datetime(db_user.display_last_active),
        hosting_status=hostingstatus2api[db_user.hosting_status],
        occupation=db_user.occupation,
        about_me=db_user.about_me,
        about_place=db_user.about_place,
        languages=db_user.languages.split("|") if db_user.languages else [],
        countries_visited=db_user.countries_visited.split(
            "|") if db_user.countries_visited else [],
        countries_lived=db_user.countries_lived.split(
            "|") if db_user.countries_lived else [],
        friends=get_friends_status(session, context.user_id, db_user.id),
        mutual_friends=[
            api_pb2.MutualFriend(
                user_id=mutual_friend.id,
                username=mutual_friend.username,
                name=mutual_friend.name,
            ) for mutual_friend in db_user.mutual_friends(context.user_id)
        ],
        smoking_allowed=smokinglocation2api[db_user.smoking_allowed],
        avatar_url=db_user.avatar_url,
    )

    if db_user.max_guests is not None:
        user.max_guests.value = db_user.max_guests

    if db_user.multiple_groups is not None:
        user.multiple_groups.value = db_user.multiple_groups

    if db_user.last_minute is not None:
        user.last_minute.value = db_user.last_minute

    if db_user.accepts_pets is not None:
        user.accepts_pets.value = db_user.accepts_pets

    if db_user.accepts_kids is not None:
        user.accepts_kids.value = db_user.accepts_kids

    if db_user.wheelchair_accessible is not None:
        user.wheelchair_accessible.value = db_user.wheelchair_accessible

    if db_user.sleeping_arrangement is not None:
        user.sleeping_arrangement.value = db_user.sleeping_arrangement

    if db_user.area is not None:
        user.area.value = db_user.area

    if db_user.house_rules is not None:
        user.house_rules.value = db_user.house_rules
    
    return user
