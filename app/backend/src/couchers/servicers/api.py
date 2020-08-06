import logging
from datetime import datetime
from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from sqlalchemy.sql import or_

from couchers.db import (get_friends_status, get_user_by_field, is_valid_color,
                         is_valid_name, session_scope)
from couchers.models import (FriendRelationship, FriendStatus, HostingPreferences,
                             HostingStatus, User, Complaint, Reference,
                             ReferenceType, SmokingLocation)
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

hostingstatus2sql = {
    api_pb2.HostingStatus.HOSTING_STATUS_UNSPECIFIED: HostingStatus.unspecified,
    api_pb2.HostingStatus.HOSTING_STATUS_UNKNOWN: HostingStatus.unknown,
    api_pb2.HostingStatus.HOSTING_STATUS_CAN_HOST: HostingStatus.can_host,
    api_pb2.HostingStatus.HOSTING_STATUS_MAYBE: HostingStatus.maybe,
    api_pb2.HostingStatus.HOSTING_STATUS_DIFFICULT: HostingStatus.difficult,
    api_pb2.HostingStatus.HOSTING_STATUS_CANT_HOST: HostingStatus.cant_host,
}

hostingstatus2api = {
    HostingStatus.unspecified: api_pb2.HostingStatus.HOSTING_STATUS_UNSPECIFIED,
    HostingStatus.unknown: api_pb2.HostingStatus.HOSTING_STATUS_UNKNOWN,
    HostingStatus.can_host: api_pb2.HostingStatus.HOSTING_STATUS_CAN_HOST,
    HostingStatus.maybe: api_pb2.HostingStatus.HOSTING_STATUS_MAYBE,
    HostingStatus.difficult: api_pb2.HostingStatus.HOSTING_STATUS_DIFFICULT,
    HostingStatus.cant_host: api_pb2.HostingStatus.HOSTING_STATUS_CANT_HOST,
}

smokinglocation2sql = {
    api_pb2.SmokingLocation.SMOKING_LOCATION_UNSPECIFIED: SmokingLocation.unspecified,
    api_pb2.SmokingLocation.SMOKING_LOCATION_UNKNOWN: SmokingLocation.unknown,
    api_pb2.SmokingLocation.SMOKING_LOCATION_YES: SmokingLocation.yes,
    api_pb2.SmokingLocation.SMOKING_LOCATION_WINDOW: SmokingLocation.window,
    api_pb2.SmokingLocation.SMOKING_LOCATION_OUTSIDE: SmokingLocation.outside,
    api_pb2.SmokingLocation.SMOKING_LOCATION_NO: SmokingLocation.no,
}

smokinglocation2api = {
    SmokingLocation.unspecified: api_pb2.SmokingLocation.SMOKING_LOCATION_UNSPECIFIED,
    SmokingLocation.unknown: api_pb2.SmokingLocation.SMOKING_LOCATION_UNKNOWN,
    SmokingLocation.yes: api_pb2.SmokingLocation.SMOKING_LOCATION_YES,
    SmokingLocation.window: api_pb2.SmokingLocation.SMOKING_LOCATION_WINDOW,
    SmokingLocation.outside: api_pb2.SmokingLocation.SMOKING_LOCATION_OUTSIDE,
    SmokingLocation.no: api_pb2.SmokingLocation.SMOKING_LOCATION_NO,
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
            num_references = session.query(Reference.from_user_id).filter(
                Reference.to_user_id == context.user_id).count()
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
                    last_active=Timestamp_from_datetime(
                        user.display_last_active),
                    occupation=user.occupation,
                    about_me=user.about_me,
                    about_place=user.about_place,
                    languages=user.languages.split(
                        "|") if user.languages else [],
                    countries_visited=user.countries_visited.split(
                        "|") if user.countries_visited else [],
                    countries_lived=user.countries_lived.split(
                        "|") if user.countries_lived else [],
                    friends=get_friends_status(
                        session, context.user_id, user.id),
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

            num_references = session.query(Reference.from_user_id).filter(
                Reference.to_user_id == user.id).count()

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
                countries_visited=user.countries_visited.split(
                    "|") if user.countries_visited else [],
                countries_lived=user.countries_lived.split(
                    "|") if user.countries_lived else [],
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
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                                  errors.INVALID_COLOR)
                user.color = color
                res.updated_color = True

            if request.languages.exists:
                user.languages = "|".join(request.languages.value)
                res.updated_languages = True

            if request.countries_visited.exists:
                user.countries_visited = "|".join(
                    request.countries_visited.value)
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
                num_references = session.query(Reference.from_user_id).filter(
                    Reference.to_user_id == user.id).count()
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
                        last_active=Timestamp_from_datetime(
                            user.display_last_active),
                        occupation=user.occupation,
                        about_me=user.about_me,
                        about_place=user.about_place,
                        languages=user.languages.split(
                            "|") if user.languages else [],
                        countries_visited=user.countries_visited.split(
                            "|") if user.countries_visited else [],
                        countries_lived=user.countries_lived.split(
                            "|") if user.countries_lived else []
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

    def GetHostingPreferences(self, request, context):
        with session_scope(self._Session) as session:
            result = (session.query(HostingPreferences)
                      .filter(HostingPreferences.user_id == request.user_id)
                      .one_or_none())

            if not result:
                if get_user_by_field(session, str(request.user_id)) is None:
                    context.abort(grpc.StatusCode.NOT_FOUND,
                                  errors.USER_NOT_FOUND)
                else:
                    res = api_pb2.GetHostingPreferencesRes(
                        hosting_status=api_pb2.HostingStatus.HOSTING_STATUS_UNSPECIFIED,
                        smoking_allowed=api_pb2.SmokingLocation.SMOKING_LOCATION_UNSPECIFIED
                    )
                    return res

            res = api_pb2.GetHostingPreferencesRes(
                hosting_status=hostingstatus2api[result.hosting_status],
                smoking_allowed=smokinglocation2api[result.smoking_allowed]
            )

            if result.max_guests != None:
                res.max_guests.value = result.max_guests

            if result.multiple_groups != None:
                res.multiple_groups.value = result.multiple_groups

            if result.last_minute != None:
                res.last_minute.value = result.last_minute

            if result.accepts_pets != None:
                res.accepts_pets.value = result.accepts_pets

            if result.accepts_kids != None:
                res.accepts_kids.value = result.accepts_kids

            if result.wheelchair_accessible != None:
                res.wheelchair_accessible.value = result.wheelchair_accessible

            if result.sleeping_arrangement != None:
                res.sleeping_arrangement.value = result.sleeping_arrangement

            if result.area != None:
                res.area.value = result.area

            if result.house_rules != None:
                res.house_rules.value = result.house_rules

            return res

    def SetHostingPreferences(self, request, context):
        with session_scope(self._Session) as session:
            prefs = (session.query(HostingPreferences)
                     .filter(HostingPreferences.user_id == context.user_id)
                     .one_or_none())

            if not prefs:
                prefs = HostingPreferences(user_id=context.user_id)
                session.add(prefs)

            if request.hosting_status != api_pb2.HostingStatus.HOSTING_STATUS_UNSPECIFIED:
                prefs.hosting_status = hostingstatus2sql[request.hosting_status]
            elif prefs.hosting_status is None:
                prefs.hosting_status = HostingStatus.unspecified

            if request.HasField("max_guests"):
                if request.max_guests.is_null:
                    prefs.max_guests = None
                else:
                    prefs.max_guests = request.max_guests.value

            if request.HasField("multiple_groups"):
                if request.multiple_groups.is_null:
                    prefs.multiple_groups = None
                else:
                    prefs.multiple_groups = request.multiple_groups.value

            if request.HasField("last_minute"):
                if request.last_minute.is_null:
                    prefs.last_minute = None
                else:
                    prefs.last_minute = request.last_minute.value

            if request.HasField("accepts_pets"):
                if request.accepts_pets.is_null:
                    prefs.accepts_pets = None
                else:
                    prefs.accepts_pets = request.accepts_pets.value

            if request.HasField("accepts_kids"):
                if request.accepts_kids.is_null:
                    prefs.accepts_kids = None
                else:
                    prefs.accepts_kids = request.accepts_kids.value

            if request.HasField("wheelchair_accessible"):
                if request.wheelchair_accessible.is_null:
                    prefs.wheelchair_accessible = None
                else:
                    prefs.wheelchair_accessible = request.wheelchair_accessible.value

            if request.smoking_allowed != api_pb2.SmokingLocation.SMOKING_LOCATION_UNSPECIFIED:
                prefs.smoking_allowed = smokinglocation2sql[request.smoking_allowed]
            elif prefs.smoking_allowed is None:
                prefs.smoking_allowed = SmokingLocation.unspecified

            if request.HasField("sleeping_arrangement"):
                if request.sleeping_arrangement.is_null:
                    prefs.sleeping_arrangement = None
                else:
                    prefs.sleeping_arrangement = request.sleeping_arrangement.value

            if request.HasField("area"):
                if request.area.is_null:
                    prefs.area = None
                else:
                    prefs.area = request.area.value

            if request.HasField("house_rules"):
                if request.house_rules.is_null:
                    prefs.house_rules = None
                else:
                    prefs.house_rules = request.house_rules.value

            session.commit()

            return empty_pb2.Empty()


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
