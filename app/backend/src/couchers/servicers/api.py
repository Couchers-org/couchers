import logging
from datetime import datetime
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from sqlalchemy.sql import or_

from couchers.db import (get_friends_status, get_user_by_field, is_valid_color,
                         is_valid_name, session_scope)
from couchers.models import (FriendRelationship, FriendStatus, User, Complaint,
                             Reference, ReferenceType)
from couchers.utils import Timestamp_from_datetime
from couchers.tasks import send_report_email
from couchers import errors
from pb import api_pb2, api_pb2_grpc


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
            num_references = session.query(Reference.from_user_id).filter(Reference.to_user_id == context.user_id).count()
            return api_pb2.PingRes(
                user=api_pb2.User(
                    user_id=user.id,
                    username=user.username,
                    name=user.name,
                    city=user.city,
                    verification=user.verification,
                    community_standing=user.community_standing,
                    num_references=num_references,
                    gender=user.gender,
                    age=user.age,
                    color=user.color,
                    joined=Timestamp_from_datetime(user.display_joined),
                    last_active=Timestamp_from_datetime(user.display_last_active),
                    occupation=user.occupation,
                    about_me=user.about_me,
                    about_place=user.about_place,
                    languages=user.languages.split("|") if user.languages else [],
                    countries_visited=user.countries_visited.split("|") if user.countries_visited else [],
                    countries_lived=user.countries_lived.split("|") if user.countries_lived else [],
                    friends=get_friends_status(session, context.user_id, user.id),
                    mutual_friends=[
                        api_pb2.MutualFriend(
                            user_id=mutual_friend.id,
                            username=mutual_friend.username,
                            name=mutual_friend.name,
                        ) for mutual_friend in user.mutual_friends(context.user_id)
                    ],
                ),
            )

    def GetUser(self, request, context):
        with session_scope(self._Session) as session:
            user = get_user_by_field(session, request.user)

            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            num_references = session.query(Reference.from_user_id).filter(Reference.to_user_id == user.id).count()

            return api_pb2.User(
                user_id=user.id,
                username=user.username,
                name=user.name,
                city=user.city,
                verification=user.verification,
                community_standing=user.community_standing,
                num_references=num_references,
                gender=user.gender,
                age=user.age,
                color=user.color,
                joined=Timestamp_from_datetime(user.display_joined),
                last_active=Timestamp_from_datetime(user.display_last_active),
                occupation=user.occupation,
                about_me=user.about_me,
                about_place=user.about_place,
                languages=user.languages.split("|") if user.languages else [],
                countries_visited=user.countries_visited.split("|") if user.countries_visited else [],
                countries_lived=user.countries_lived.split("|") if user.countries_lived else [],
                friends=get_friends_status(session, context.user_id, user.id),
                mutual_friends=[
                    api_pb2.MutualFriend(
                        user_id=mutual_friend.id,
                        username=mutual_friend.username,
                        name=mutual_friend.name,
                    ) for mutual_friend in user.mutual_friends(context.user_id)
                ],
            )

    def UpdateProfile(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            res = api_pb2.UpdateProfileRes()

            if request.HasField("name"):
                if not is_valid_name(request.name.value):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                                  errors.INVALID_NAME)
                user.name = request.name.value
                res.updated_name = True

            if request.HasField("city"):
                user.city = request.city.value
                res.updated_city = True

            if request.HasField("gender"):
                user.gender = request.gender.value
                res.updated_gender = True

            if request.HasField("occupation"):
                user.occupation = request.occupation.value
                res.updated_occupation = True

            if request.HasField("about_me"):
                user.about_me = request.about_me.value
                res.updated_about_me = True

            if request.HasField("about_place"):
                user.about_place = request.about_place.value
                res.updated_about_place = True

            if request.HasField("color"):
                color = request.color.value.lower()
                if not is_valid_color(color):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COLOR)
                user.color = color
                res.updated_color = True

            if request.languages.exists:
                user.languages = "|".join(request.languages.value)
                res.updated_languages = True

            if request.countries_visited.exists:
                user.countries_visited = "|".join(request.countries_visited.value)
                res.updated_countries_visited = True

            if request.countries_lived.exists:
                user.countries_lived = "|".join(request.countries_lived.value)
                res.updated_countries_lived = True

            # save updates
            session.commit()

            return res

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
                user_ids=[rel.from_user.id if rel.from_user.id != context.user_id else rel.to_user.id for rel in rels],
            )

    def SendFriendRequest(self, request, context):
        with session_scope(self._Session) as session:
            from_user = session.query(User).filter(User.id == context.user_id).one_or_none()

            if not from_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            to_user = session.query(User).filter(User.id == request.user_id).one_or_none()

            if not to_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if get_friends_status(session, from_user.id, to_user.id) != api_pb2.User.FriendshipStatus.NOT_FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.FRIENDS_ALREADY_OR_PENDING)

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
                context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

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
                context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

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
                num_references = session.query(Reference.from_user_id).filter(Reference.to_user_id == user.id).count()
                users.append(
                    api_pb2.User(
                        username=user.username,
                        name=user.name,
                        city=user.city,
                        verification=user.verification,
                        community_standing=user.community_standing,
                        num_references=num_references,
                        gender=user.gender,
                        age=user.age,
                        color=user.color,
                        joined=Timestamp_from_datetime(user.display_joined),
                        last_active=Timestamp_from_datetime(user.display_last_active),
                        occupation=user.occupation,
                        about_me=user.about_me,
                        about_place=user.about_place,
                        languages=user.languages.split("|") if user.languages else [],
                        countries_visited=user.countries_visited.split("|") if user.countries_visited else [],
                        countries_lived=user.countries_lived.split("|") if user.countries_lived else []
                    )
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
            if not session.query(User).filter(User.id == request.reported_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND,
                              errors.USER_NOT_FOUND)
            session.add(message)

        send_report_email(context.user_id, request.reported_user_id,
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
            query = query.filter(Reference.from_user_id == request.from_user_id)
            if request.HasField("type_filter"):
                query = query.filter(Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def GetReceivedReferences(self, request, context):
        with session_scope(self._Session) as session:
            query = session.query(Reference)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            if request.HasField("type_filter"):
                query = query.filter(Reference.reference_type == reftype2sql[request.type_filter.value])
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


def paginate_references_result(request, query):
    total_matches = query.count()
    references = query.order_by(Reference.time).offset(request.start_at).limit(request.number).all()
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

