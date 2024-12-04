from datetime import timedelta
from urllib.parse import urlencode

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, delete, func, intersect, or_, union

from couchers import errors, urls
from couchers.config import config
from couchers.crypto import b64encode, generate_hash_signature, random_hex
from couchers.materialized_views import lite_users
from couchers.models import (
    FriendRelationship,
    FriendStatus,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    InitiatedUpload,
    LanguageAbility,
    LanguageFluency,
    MeetupStatus,
    Message,
    ParkingDetails,
    Reference,
    RegionLived,
    RegionVisited,
    SleepingArrangement,
    SmokingLocation,
    User,
    UserBadge,
)
from couchers.notifications.notify import notify
from couchers.resources import get_badge_dict, language_is_allowed, region_is_allowed
from couchers.servicers.account import get_strong_verification_fields
from couchers.sql import couchers_select as select
from couchers.sql import is_valid_user_id, is_valid_username
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    get_coordinates,
    is_valid_name,
    now,
)
from proto import api_pb2, api_pb2_grpc, media_pb2, notification_data_pb2

MAX_USERS_PER_QUERY = 200
MAX_PAGINATION_LENGTH = 50

hostingstatus2sql = {
    api_pb2.HOSTING_STATUS_UNKNOWN: None,
    api_pb2.HOSTING_STATUS_CAN_HOST: HostingStatus.can_host,
    api_pb2.HOSTING_STATUS_MAYBE: HostingStatus.maybe,
    api_pb2.HOSTING_STATUS_CANT_HOST: HostingStatus.cant_host,
}

hostingstatus2api = {
    None: api_pb2.HOSTING_STATUS_UNKNOWN,
    HostingStatus.can_host: api_pb2.HOSTING_STATUS_CAN_HOST,
    HostingStatus.maybe: api_pb2.HOSTING_STATUS_MAYBE,
    HostingStatus.cant_host: api_pb2.HOSTING_STATUS_CANT_HOST,
}

meetupstatus2sql = {
    api_pb2.MEETUP_STATUS_UNKNOWN: None,
    api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP: MeetupStatus.wants_to_meetup,
    api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP: MeetupStatus.open_to_meetup,
    api_pb2.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP: MeetupStatus.does_not_want_to_meetup,
}

meetupstatus2api = {
    None: api_pb2.MEETUP_STATUS_UNKNOWN,
    MeetupStatus.wants_to_meetup: api_pb2.MEETUP_STATUS_WANTS_TO_MEETUP,
    MeetupStatus.open_to_meetup: api_pb2.MEETUP_STATUS_OPEN_TO_MEETUP,
    MeetupStatus.does_not_want_to_meetup: api_pb2.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP,
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

sleepingarrangement2sql = {
    api_pb2.SLEEPING_ARRANGEMENT_UNKNOWN: None,
    api_pb2.SLEEPING_ARRANGEMENT_PRIVATE: SleepingArrangement.private,
    api_pb2.SLEEPING_ARRANGEMENT_COMMON: SleepingArrangement.common,
    api_pb2.SLEEPING_ARRANGEMENT_SHARED_ROOM: SleepingArrangement.shared_room,
    api_pb2.SLEEPING_ARRANGEMENT_SHARED_SPACE: SleepingArrangement.shared_space,
}

sleepingarrangement2api = {
    None: api_pb2.SLEEPING_ARRANGEMENT_UNKNOWN,
    SleepingArrangement.private: api_pb2.SLEEPING_ARRANGEMENT_PRIVATE,
    SleepingArrangement.common: api_pb2.SLEEPING_ARRANGEMENT_COMMON,
    SleepingArrangement.shared_room: api_pb2.SLEEPING_ARRANGEMENT_SHARED_ROOM,
    SleepingArrangement.shared_space: api_pb2.SLEEPING_ARRANGEMENT_SHARED_SPACE,
}

parkingdetails2sql = {
    api_pb2.PARKING_DETAILS_UNKNOWN: None,
    api_pb2.PARKING_DETAILS_FREE_ONSITE: ParkingDetails.free_onsite,
    api_pb2.PARKING_DETAILS_FREE_OFFSITE: ParkingDetails.free_offsite,
    api_pb2.PARKING_DETAILS_PAID_ONSITE: ParkingDetails.paid_onsite,
    api_pb2.PARKING_DETAILS_PAID_OFFSITE: ParkingDetails.paid_offsite,
}

parkingdetails2api = {
    None: api_pb2.PARKING_DETAILS_UNKNOWN,
    ParkingDetails.free_onsite: api_pb2.PARKING_DETAILS_FREE_ONSITE,
    ParkingDetails.free_offsite: api_pb2.PARKING_DETAILS_FREE_OFFSITE,
    ParkingDetails.paid_onsite: api_pb2.PARKING_DETAILS_PAID_ONSITE,
    ParkingDetails.paid_offsite: api_pb2.PARKING_DETAILS_PAID_OFFSITE,
}

fluency2sql = {
    api_pb2.LanguageAbility.Fluency.FLUENCY_UNKNOWN: None,
    api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER: LanguageFluency.beginner,
    api_pb2.LanguageAbility.Fluency.FLUENCY_CONVERSATIONAL: LanguageFluency.conversational,
    api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT: LanguageFluency.fluent,
}

fluency2api = {
    None: api_pb2.LanguageAbility.Fluency.FLUENCY_UNKNOWN,
    LanguageFluency.beginner: api_pb2.LanguageAbility.Fluency.FLUENCY_BEGINNER,
    LanguageFluency.conversational: api_pb2.LanguageAbility.Fluency.FLUENCY_CONVERSATIONAL,
    LanguageFluency.fluent: api_pb2.LanguageAbility.Fluency.FLUENCY_FLUENT,
}


class API(api_pb2_grpc.APIServicer):
    def Ping(self, request, context, session):
        # auth ought to make sure the user exists
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        # gets only the max message by self-joining messages which have a greater id
        # if it doesn't have a greater id, it's the biggest
        message_2 = aliased(Message)
        unseen_sent_host_request_count = session.execute(
            select(func.count())
            .select_from(Message)
            .join(HostRequest, Message.conversation_id == HostRequest.conversation_id)
            .outerjoin(message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id))
            .where(HostRequest.surfer_user_id == context.user_id)
            .where_users_column_visible(context, HostRequest.host_user_id)
            .where(message_2.id == None)
            .where(HostRequest.surfer_last_seen_message_id < Message.id)
        ).scalar_one()

        unseen_received_host_request_count = session.execute(
            select(func.count())
            .select_from(Message)
            .join(HostRequest, Message.conversation_id == HostRequest.conversation_id)
            .outerjoin(message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id))
            .where_users_column_visible(context, HostRequest.surfer_user_id)
            .where(HostRequest.host_user_id == context.user_id)
            .where(message_2.id == None)
            .where(HostRequest.host_last_seen_message_id < Message.id)
        ).scalar_one()

        unseen_message_count = session.execute(
            select(func.count())
            .select_from(Message)
            .outerjoin(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
            .where(GroupChatSubscription.user_id == context.user_id)
            .where(Message.time >= GroupChatSubscription.joined)
            .where(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
            .where(Message.id > GroupChatSubscription.last_seen_message_id)
        ).scalar_one()

        pending_friend_request_count = session.execute(
            select(func.count())
            .select_from(FriendRelationship)
            .where(FriendRelationship.to_user_id == context.user_id)
            .where_users_column_visible(context, FriendRelationship.from_user_id)
            .where(FriendRelationship.status == FriendStatus.pending)
        ).scalar_one()

        return api_pb2.PingRes(
            user=user_model_to_pb(user, session, context),
            unseen_message_count=unseen_message_count,
            unseen_sent_host_request_count=unseen_sent_host_request_count,
            unseen_received_host_request_count=unseen_received_host_request_count,
            pending_friend_request_count=pending_friend_request_count,
        )

    def GetUser(self, request, context, session):
        user = session.execute(
            select(User).where_users_visible(context).where_username_or_id(request.user)
        ).scalar_one_or_none()

        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        return user_model_to_pb(user, session, context)

    def GetLiteUser(self, request, context, session):
        lite_user = session.execute(
            select(lite_users)
            .where_users_visible(context, table=lite_users.c)
            .where_username_or_id(request.user, table=lite_users.c)
        ).one_or_none()

        if not lite_user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        return lite_user_to_pb(lite_user)

    def GetLiteUsers(self, request, context, session):
        if len(request.users) > MAX_USERS_PER_QUERY:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.REQUESTED_TOO_MANY_USERS)

        usernames = {u for u in request.users if is_valid_username(u)}
        ids = {u for u in request.users if is_valid_user_id(u)}

        users = session.execute(
            select(lite_users)
            .where_users_visible(context, table=lite_users.c)
            .where(or_(lite_users.c.username.in_(usernames), lite_users.c.id.in_(ids)))
        ).all()

        users_by_id = {str(user.id): user for user in users}
        users_by_username = {user.username: user for user in users}

        res = api_pb2.GetLiteUsersRes()

        for user in request.users:
            lite_user = None
            if user in users_by_id:
                lite_user = users_by_id[user]
            elif user in users_by_username:
                lite_user = users_by_username[user]

            res.responses.append(
                api_pb2.LiteUserRes(
                    query=user,
                    not_found=lite_user is None,
                    user=lite_user_to_pb(lite_user) if lite_user else None,
                )
            )

        return res

    def UpdateProfile(self, request, context, session):
        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

        if request.HasField("name"):
            if not is_valid_name(request.name.value):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)
            user.name = request.name.value

        if request.HasField("city"):
            user.city = request.city.value

        if request.HasField("hometown"):
            if request.hometown.is_null:
                user.hometown = None
            else:
                user.hometown = request.hometown.value

        if request.HasField("lat") and request.HasField("lng"):
            if request.lat.value == 0 and request.lng.value == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
            user.geom = create_coordinate(request.lat.value, request.lng.value)

        if request.HasField("radius"):
            user.geom_radius = request.radius.value

        if request.HasField("avatar_key"):
            if request.avatar_key.is_null:
                user.avatar_key = None
            else:
                user.avatar_key = request.avatar_key.value

        # if request.HasField("gender"):
        #     user.gender = request.gender.value

        if request.HasField("pronouns"):
            if request.pronouns.is_null:
                user.pronouns = None
            else:
                user.pronouns = request.pronouns.value

        if request.HasField("occupation"):
            if request.occupation.is_null:
                user.occupation = None
            else:
                user.occupation = request.occupation.value

        if request.HasField("education"):
            if request.education.is_null:
                user.education = None
            else:
                user.education = request.education.value

        if request.HasField("about_me"):
            if request.about_me.is_null:
                user.about_me = None
            else:
                user.about_me = request.about_me.value

        if request.HasField("things_i_like"):
            if request.things_i_like.is_null:
                user.things_i_like = None
            else:
                user.things_i_like = request.things_i_like.value

        if request.HasField("about_place"):
            if request.about_place.is_null:
                user.about_place = None
            else:
                user.about_place = request.about_place.value

        if request.hosting_status != api_pb2.HOSTING_STATUS_UNSPECIFIED:
            if user.do_not_email and request.hosting_status != api_pb2.HOSTING_STATUS_CANT_HOST:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DO_NOT_EMAIL_CANNOT_HOST)
            user.hosting_status = hostingstatus2sql[request.hosting_status]

        if request.meetup_status != api_pb2.MEETUP_STATUS_UNSPECIFIED:
            if user.do_not_email and request.meetup_status != api_pb2.MEETUP_STATUS_DOES_NOT_WANT_TO_MEETUP:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.DO_NOT_EMAIL_CANNOT_MEET)
            user.meetup_status = meetupstatus2sql[request.meetup_status]

        if request.HasField("language_abilities"):
            # delete all existing abilities
            for ability in user.language_abilities:
                session.delete(ability)
            session.flush()

            # add the new ones
            for language_ability in request.language_abilities.value:
                if not language_is_allowed(language_ability.code):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_LANGUAGE)
                session.add(
                    LanguageAbility(
                        user=user,
                        language_code=language_ability.code,
                        fluency=fluency2sql[language_ability.fluency],
                    )
                )

        if request.HasField("regions_visited"):
            session.execute(delete(RegionVisited).where(RegionVisited.user_id == context.user_id))

            for region in request.regions_visited.value:
                if not region_is_allowed(region):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_REGION)
                session.add(
                    RegionVisited(
                        user_id=user.id,
                        region_code=region,
                    )
                )

        if request.HasField("regions_lived"):
            session.execute(delete(RegionLived).where(RegionLived.user_id == context.user_id))

            for region in request.regions_lived.value:
                if not region_is_allowed(region):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_REGION)
                session.add(
                    RegionLived(
                        user_id=user.id,
                        region_code=region,
                    )
                )

        if request.HasField("additional_information"):
            if request.additional_information.is_null:
                user.additional_information = None
            else:
                user.additional_information = request.additional_information.value

        if request.HasField("max_guests"):
            if request.max_guests.is_null:
                user.max_guests = None
            else:
                user.max_guests = request.max_guests.value

        if request.HasField("last_minute"):
            if request.last_minute.is_null:
                user.last_minute = None
            else:
                user.last_minute = request.last_minute.value

        if request.HasField("has_pets"):
            if request.has_pets.is_null:
                user.has_pets = None
            else:
                user.has_pets = request.has_pets.value

        if request.HasField("accepts_pets"):
            if request.accepts_pets.is_null:
                user.accepts_pets = None
            else:
                user.accepts_pets = request.accepts_pets.value

        if request.HasField("pet_details"):
            if request.pet_details.is_null:
                user.pet_details = None
            else:
                user.pet_details = request.pet_details.value

        if request.HasField("has_kids"):
            if request.has_kids.is_null:
                user.has_kids = None
            else:
                user.has_kids = request.has_kids.value

        if request.HasField("accepts_kids"):
            if request.accepts_kids.is_null:
                user.accepts_kids = None
            else:
                user.accepts_kids = request.accepts_kids.value

        if request.HasField("kid_details"):
            if request.kid_details.is_null:
                user.kid_details = None
            else:
                user.kid_details = request.kid_details.value

        if request.HasField("has_housemates"):
            if request.has_housemates.is_null:
                user.has_housemates = None
            else:
                user.has_housemates = request.has_housemates.value

        if request.HasField("housemate_details"):
            if request.housemate_details.is_null:
                user.housemate_details = None
            else:
                user.housemate_details = request.housemate_details.value

        if request.HasField("wheelchair_accessible"):
            if request.wheelchair_accessible.is_null:
                user.wheelchair_accessible = None
            else:
                user.wheelchair_accessible = request.wheelchair_accessible.value

        if request.smoking_allowed != api_pb2.SMOKING_LOCATION_UNSPECIFIED:
            user.smoking_allowed = smokinglocation2sql[request.smoking_allowed]

        if request.HasField("smokes_at_home"):
            if request.smokes_at_home.is_null:
                user.smokes_at_home = None
            else:
                user.smokes_at_home = request.smokes_at_home.value

        if request.HasField("drinking_allowed"):
            if request.drinking_allowed.is_null:
                user.drinking_allowed = None
            else:
                user.drinking_allowed = request.drinking_allowed.value

        if request.HasField("drinks_at_home"):
            if request.drinks_at_home.is_null:
                user.drinks_at_home = None
            else:
                user.drinks_at_home = request.drinks_at_home.value

        if request.HasField("other_host_info"):
            if request.other_host_info.is_null:
                user.other_host_info = None
            else:
                user.other_host_info = request.other_host_info.value

        if request.sleeping_arrangement != api_pb2.SLEEPING_ARRANGEMENT_UNSPECIFIED:
            user.sleeping_arrangement = sleepingarrangement2sql[request.sleeping_arrangement]

        if request.HasField("sleeping_details"):
            if request.sleeping_details.is_null:
                user.sleeping_details = None
            else:
                user.sleeping_details = request.sleeping_details.value

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

        if request.HasField("parking"):
            if request.parking.is_null:
                user.parking = None
            else:
                user.parking = request.parking.value

        if request.parking_details != api_pb2.PARKING_DETAILS_UNSPECIFIED:
            user.parking_details = parkingdetails2sql[request.parking_details]

        if request.HasField("camping_ok"):
            if request.camping_ok.is_null:
                user.camping_ok = None
            else:
                user.camping_ok = request.camping_ok.value

        # save updates
        session.commit()

        return empty_pb2.Empty()

    def ListFriends(self, request, context, session):
        rels = (
            session.execute(
                select(FriendRelationship)
                .where_users_column_visible(context, FriendRelationship.from_user_id)
                .where_users_column_visible(context, FriendRelationship.to_user_id)
                .where(
                    or_(
                        FriendRelationship.from_user_id == context.user_id,
                        FriendRelationship.to_user_id == context.user_id,
                    )
                )
                .where(FriendRelationship.status == FriendStatus.accepted)
            )
            .scalars()
            .all()
        )
        return api_pb2.ListFriendsRes(
            user_ids=[rel.from_user.id if rel.from_user.id != context.user_id else rel.to_user.id for rel in rels],
        )

    def ListMutualFriends(self, request, context, session):
        if context.user_id == request.user_id:
            return api_pb2.ListMutualFriendsRes(mutual_friends=[])

        user = session.execute(
            select(User).where_users_visible(context).where(User.id == request.user_id)
        ).scalar_one_or_none()

        if not user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        q1 = (
            select(FriendRelationship.from_user_id.label("user_id"))
            .where(FriendRelationship.to_user_id == context.user_id)
            .where(FriendRelationship.from_user_id != request.user_id)
            .where(FriendRelationship.status == FriendStatus.accepted)
        )

        q2 = (
            select(FriendRelationship.to_user_id.label("user_id"))
            .where(FriendRelationship.from_user_id == context.user_id)
            .where(FriendRelationship.to_user_id != request.user_id)
            .where(FriendRelationship.status == FriendStatus.accepted)
        )

        q3 = (
            select(FriendRelationship.from_user_id.label("user_id"))
            .where(FriendRelationship.to_user_id == request.user_id)
            .where(FriendRelationship.from_user_id != context.user_id)
            .where(FriendRelationship.status == FriendStatus.accepted)
        )

        q4 = (
            select(FriendRelationship.to_user_id.label("user_id"))
            .where(FriendRelationship.from_user_id == request.user_id)
            .where(FriendRelationship.to_user_id != context.user_id)
            .where(FriendRelationship.status == FriendStatus.accepted)
        )

        mutual = select(intersect(union(q1, q2), union(q3, q4)).subquery())

        mutual_friends = (
            session.execute(select(User).where_users_visible(context).where(User.id.in_(mutual))).scalars().all()
        )

        return api_pb2.ListMutualFriendsRes(
            mutual_friends=[
                api_pb2.MutualFriend(user_id=mutual_friend.id, username=mutual_friend.username, name=mutual_friend.name)
                for mutual_friend in mutual_friends
            ]
        )

    def SendFriendRequest(self, request, context, session):
        if context.user_id == request.user_id:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.CANT_FRIEND_SELF)

        user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()
        to_user = session.execute(
            select(User).where_users_visible(context).where(User.id == request.user_id)
        ).scalar_one_or_none()

        if not to_user:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

        if (
            session.execute(
                select(FriendRelationship)
                .where(
                    or_(
                        and_(
                            FriendRelationship.from_user_id == context.user_id,
                            FriendRelationship.to_user_id == request.user_id,
                        ),
                        and_(
                            FriendRelationship.from_user_id == request.user_id,
                            FriendRelationship.to_user_id == context.user_id,
                        ),
                    )
                )
                .where(
                    or_(
                        FriendRelationship.status == FriendStatus.accepted,
                        FriendRelationship.status == FriendStatus.pending,
                    )
                )
            ).scalar_one_or_none()
            is not None
        ):
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.FRIENDS_ALREADY_OR_PENDING)

        # TODO: Race condition where we can create two friend reqs, needs db constraint! See comment in table

        friend_relationship = FriendRelationship(from_user=user, to_user=to_user, status=FriendStatus.pending)
        session.add(friend_relationship)
        session.flush()

        notify(
            session,
            user_id=friend_relationship.to_user_id,
            topic_action="friend_request:create",
            key=friend_relationship.from_user_id,
            data=notification_data_pb2.FriendRequestCreate(
                other_user=user_model_to_pb(friend_relationship.from_user, session, context),
            ),
        )

        return empty_pb2.Empty()

    def ListFriendRequests(self, request, context, session):
        # both sent and received
        sent_requests = (
            session.execute(
                select(FriendRelationship)
                .where_users_column_visible(context, FriendRelationship.to_user_id)
                .where(FriendRelationship.from_user_id == context.user_id)
                .where(FriendRelationship.status == FriendStatus.pending)
            )
            .scalars()
            .all()
        )

        received_requests = (
            session.execute(
                select(FriendRelationship)
                .where_users_column_visible(context, FriendRelationship.from_user_id)
                .where(FriendRelationship.to_user_id == context.user_id)
                .where(FriendRelationship.status == FriendStatus.pending)
            )
            .scalars()
            .all()
        )

        return api_pb2.ListFriendRequestsRes(
            sent=[
                api_pb2.FriendRequest(
                    friend_request_id=friend_request.id,
                    state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                    user_id=friend_request.to_user.id,
                    sent=True,
                )
                for friend_request in sent_requests
            ],
            received=[
                api_pb2.FriendRequest(
                    friend_request_id=friend_request.id,
                    state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                    user_id=friend_request.from_user.id,
                    sent=False,
                )
                for friend_request in received_requests
            ],
        )

    def RespondFriendRequest(self, request, context, session):
        friend_request = session.execute(
            select(FriendRelationship)
            .where_users_column_visible(context, FriendRelationship.from_user_id)
            .where(FriendRelationship.to_user_id == context.user_id)
            .where(FriendRelationship.status == FriendStatus.pending)
            .where(FriendRelationship.id == request.friend_request_id)
        ).scalar_one_or_none()

        if not friend_request:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

        friend_request.status = FriendStatus.accepted if request.accept else FriendStatus.rejected
        friend_request.time_responded = func.now()

        session.flush()

        if friend_request.status == FriendStatus.accepted:
            notify(
                session,
                user_id=friend_request.from_user_id,
                topic_action="friend_request:accept",
                key=friend_request.to_user_id,
                data=notification_data_pb2.FriendRequestAccept(
                    other_user=user_model_to_pb(friend_request.to_user, session, context),
                ),
            )

        return empty_pb2.Empty()

    def CancelFriendRequest(self, request, context, session):
        friend_request = session.execute(
            select(FriendRelationship)
            .where_users_column_visible(context, FriendRelationship.to_user_id)
            .where(FriendRelationship.from_user_id == context.user_id)
            .where(FriendRelationship.status == FriendStatus.pending)
            .where(FriendRelationship.id == request.friend_request_id)
        ).scalar_one_or_none()

        if not friend_request:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

        friend_request.status = FriendStatus.cancelled
        friend_request.time_responded = func.now()

        # note no notifications

        session.commit()

        return empty_pb2.Empty()

    def InitiateMediaUpload(self, request, context, session):
        key = random_hex()

        created = now()
        expiry = created + timedelta(minutes=20)

        upload = InitiatedUpload(key=key, created=created, expiry=expiry, initiator_user_id=context.user_id)
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

        data = b64encode(req)
        sig = b64encode(generate_hash_signature(req, config["MEDIA_SERVER_SECRET_KEY"]))

        path = "upload?" + urlencode({"data": data, "sig": sig})

        return api_pb2.InitiateMediaUploadRes(
            upload_url=urls.media_upload_url(path=path),
            expiry=Timestamp_from_datetime(expiry),
        )

    def ListBadgeUsers(self, request, context, session):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_user_id = int(request.page_token) if request.page_token else 0
        badge = get_badge_dict().get(request.badge_id)
        if not badge:
            context.abort(grpc.StatusCode.NOT_FOUND, errors.BADGE_NOT_FOUND)

        badge_user_ids = (
            session.execute(
                select(UserBadge.user_id)
                .where(UserBadge.badge_id == badge["id"])
                .where(UserBadge.user_id >= next_user_id)
                .order_by(UserBadge.user_id)
                .limit(page_size + 1)
            )
            .scalars()
            .all()
        )

        return api_pb2.ListBadgeUsersRes(
            user_ids=badge_user_ids[:page_size],
            next_page_token=str(badge_user_ids[-1]) if len(badge_user_ids) > page_size else None,
        )


def user_model_to_pb(db_user, session, context):
    num_references = session.execute(
        select(func.count())
        .select_from(Reference)
        .join(User, User.id == Reference.from_user_id)
        .where(User.is_visible)
        .where(Reference.to_user_id == db_user.id)
    ).scalar_one()

    # returns (lat, lng)
    # we put people without coords on null island
    # https://en.wikipedia.org/wiki/Null_Island
    lat, lng = db_user.coordinates or (0, 0)

    pending_friend_request = None
    if db_user.id == context.user_id:
        friends_status = api_pb2.User.FriendshipStatus.NA
    else:
        friend_relationship = session.execute(
            select(FriendRelationship)
            .where(
                or_(
                    and_(
                        FriendRelationship.from_user_id == context.user_id,
                        FriendRelationship.to_user_id == db_user.id,
                    ),
                    and_(
                        FriendRelationship.from_user_id == db_user.id,
                        FriendRelationship.to_user_id == context.user_id,
                    ),
                )
            )
            .where(
                or_(
                    FriendRelationship.status == FriendStatus.accepted,
                    FriendRelationship.status == FriendStatus.pending,
                )
            )
        ).scalar_one_or_none()

        if friend_relationship:
            if friend_relationship.status == FriendStatus.accepted:
                friends_status = api_pb2.User.FriendshipStatus.FRIENDS
            else:
                friends_status = api_pb2.User.FriendshipStatus.PENDING
                if friend_relationship.from_user_id == context.user_id:
                    # we sent it
                    pending_friend_request = api_pb2.FriendRequest(
                        friend_request_id=friend_relationship.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_relationship.to_user.id,
                        sent=True,
                    )
                else:
                    # we received it
                    pending_friend_request = api_pb2.FriendRequest(
                        friend_request_id=friend_relationship.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_relationship.from_user.id,
                        sent=False,
                    )
        else:
            friends_status = api_pb2.User.FriendshipStatus.NOT_FRIENDS

    verification_score = 0.0
    if db_user.phone_verification_verified:
        verification_score += 1.0 * db_user.phone_is_verified

    user = api_pb2.User(
        user_id=db_user.id,
        username=db_user.username,
        name=db_user.name,
        city=db_user.city,
        hometown=db_user.hometown,
        timezone=db_user.timezone,
        lat=lat,
        lng=lng,
        radius=db_user.geom_radius,
        verification=verification_score,
        community_standing=db_user.community_standing,
        num_references=num_references,
        gender=db_user.gender,
        pronouns=db_user.pronouns,
        age=int(db_user.age),
        joined=Timestamp_from_datetime(db_user.display_joined),
        last_active=Timestamp_from_datetime(db_user.display_last_active),
        hosting_status=hostingstatus2api[db_user.hosting_status],
        meetup_status=meetupstatus2api[db_user.meetup_status],
        occupation=db_user.occupation,
        education=db_user.education,
        about_me=db_user.about_me,
        things_i_like=db_user.things_i_like,
        about_place=db_user.about_place,
        language_abilities=[
            api_pb2.LanguageAbility(code=ability.language_code, fluency=fluency2api[ability.fluency])
            for ability in db_user.language_abilities
        ],
        regions_visited=[region.code for region in db_user.regions_visited],
        regions_lived=[region.code for region in db_user.regions_lived],
        additional_information=db_user.additional_information,
        friends=friends_status,
        pending_friend_request=pending_friend_request,
        smoking_allowed=smokinglocation2api[db_user.smoking_allowed],
        sleeping_arrangement=sleepingarrangement2api[db_user.sleeping_arrangement],
        parking_details=parkingdetails2api[db_user.parking_details],
        avatar_url=db_user.avatar.full_url if db_user.avatar else None,
        avatar_thumbnail_url=db_user.avatar.thumbnail_url if db_user.avatar else None,
        badges=[badge.badge_id for badge in db_user.badges],
        **get_strong_verification_fields(session, db_user),
    )

    if db_user.max_guests is not None:
        user.max_guests.value = db_user.max_guests

    if db_user.last_minute is not None:
        user.last_minute.value = db_user.last_minute

    if db_user.has_pets is not None:
        user.has_pets.value = db_user.has_pets

    if db_user.accepts_pets is not None:
        user.accepts_pets.value = db_user.accepts_pets

    if db_user.pet_details is not None:
        user.pet_details.value = db_user.pet_details

    if db_user.has_kids is not None:
        user.has_kids.value = db_user.has_kids

    if db_user.accepts_kids is not None:
        user.accepts_kids.value = db_user.accepts_kids

    if db_user.kid_details is not None:
        user.kid_details.value = db_user.kid_details

    if db_user.has_housemates is not None:
        user.has_housemates.value = db_user.has_housemates

    if db_user.housemate_details is not None:
        user.housemate_details.value = db_user.housemate_details

    if db_user.wheelchair_accessible is not None:
        user.wheelchair_accessible.value = db_user.wheelchair_accessible

    if db_user.smokes_at_home is not None:
        user.smokes_at_home.value = db_user.smokes_at_home

    if db_user.drinking_allowed is not None:
        user.drinking_allowed.value = db_user.drinking_allowed

    if db_user.drinks_at_home is not None:
        user.drinks_at_home.value = db_user.drinks_at_home

    if db_user.other_host_info is not None:
        user.other_host_info.value = db_user.other_host_info

    if db_user.sleeping_details is not None:
        user.sleeping_details.value = db_user.sleeping_details

    if db_user.area is not None:
        user.area.value = db_user.area

    if db_user.house_rules is not None:
        user.house_rules.value = db_user.house_rules

    if db_user.parking is not None:
        user.parking.value = db_user.parking

    if db_user.camping_ok is not None:
        user.camping_ok.value = db_user.camping_ok

    return user


def lite_user_to_pb(lite_user):
    lat, lng = get_coordinates(lite_user.geom) or (0, 0)

    return api_pb2.LiteUser(
        user_id=lite_user.id,
        username=lite_user.username,
        name=lite_user.name,
        city=lite_user.city,
        age=int(lite_user.age),
        avatar_url=urls.media_url(filename=lite_user.avatar_filename, size="full")
        if lite_user.avatar_filename
        else None,
        avatar_thumbnail_url=urls.media_url(filename=lite_user.avatar_filename, size="thumbnail")
        if lite_user.avatar_filename
        else None,
        lat=lat,
        lng=lng,
        radius=lite_user.radius,
        has_strong_verification=lite_user.has_strong_verification,
    )
