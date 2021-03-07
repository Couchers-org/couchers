from base64 import urlsafe_b64encode
from datetime import timedelta
from urllib.parse import urlencode

import grpc
from google.protobuf import empty_pb2
from sqlalchemy.orm import aliased
from sqlalchemy.sql import and_, func, or_

from couchers import errors, urls
from couchers.config import config
from couchers.crypto import generate_hash_signature, random_hex
from couchers.db import get_friends_status, get_user_by_field, is_valid_name, session_scope
from couchers.models import (
    Complaint,
    FriendRelationship,
    FriendStatus,
    GroupChatSubscription,
    HostingStatus,
    HostRequest,
    InitiatedUpload,
    MeetupStatus,
    Message,
    ParkingDetails,
    Reference,
    ReferenceType,
    SleepingArrangement,
    SmokingLocation,
    User,
)
from couchers.tasks import send_friend_request_email, send_report_email
from couchers.utils import Timestamp_from_datetime, create_coordinate, now
from pb import api_pb2, api_pb2_grpc, media_pb2

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


class API(api_pb2_grpc.APIServicer):
    def Ping(self, request, context):
        with session_scope() as session:
            # auth ought to make sure the user exists
            user = session.query(User).filter(User.id == context.user_id).one()

            # gets only the max message by self-joining messages which have a greater id
            # if it doesn't have a greater id, it's the biggest
            message_2 = aliased(Message)
            unseen_sent_host_request_count = (
                session.query(Message.id)
                .join(HostRequest, Message.conversation_id == HostRequest.conversation_id)
                .outerjoin(
                    message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id)
                )
                .filter(HostRequest.from_user_id == context.user_id)
                .filter(message_2.id == None)
                .filter(HostRequest.from_last_seen_message_id < Message.id)
                .count()
            )

            unseen_received_host_request_count = (
                session.query(Message.id)
                .join(HostRequest, Message.conversation_id == HostRequest.conversation_id)
                .outerjoin(
                    message_2, and_(Message.conversation_id == message_2.conversation_id, Message.id < message_2.id)
                )
                .filter(HostRequest.to_user_id == context.user_id)
                .filter(message_2.id == None)
                .filter(HostRequest.to_last_seen_message_id < Message.id)
                .count()
            )

            unseen_message_count = (
                session.query(Message.id)
                .outerjoin(GroupChatSubscription, GroupChatSubscription.group_chat_id == Message.conversation_id)
                .filter(GroupChatSubscription.user_id == context.user_id)
                .filter(Message.time >= GroupChatSubscription.joined)
                .filter(or_(Message.time <= GroupChatSubscription.left, GroupChatSubscription.left == None))
                .filter(Message.id > GroupChatSubscription.last_seen_message_id)
                .count()
            )

            pending_friend_request_count = (
                session.query(FriendRelationship)
                .filter(FriendRelationship.to_user_id == context.user_id)
                .filter(FriendRelationship.status == FriendStatus.pending)
                .count()
            )

            return api_pb2.PingRes(
                user=user_model_to_pb(user, session, context),
                unseen_message_count=unseen_message_count,
                unseen_sent_host_request_count=unseen_sent_host_request_count,
                unseen_received_host_request_count=unseen_received_host_request_count,
                pending_friend_request_count=pending_friend_request_count,
            )

    def GetUser(self, request, context):
        with session_scope() as session:
            user = get_user_by_field(session, request.user)

            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            return user_model_to_pb(user, session, context)

    def UpdateProfile(self, request, context):
        with session_scope() as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            if request.HasField("name"):
                if not is_valid_name(request.name.value):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_NAME)
                user.name = request.name.value

            if request.HasField("city"):
                user.city = request.city.value

            if request.HasField("hometown"):
                user.hometown = request.hometown.value

            if request.HasField("lat") and request.HasField("lng"):
                if request.lat.value == 0 and request.lng.value == 0:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
                user.geom = create_coordinate(request.lat.value, request.lng.value)

            if request.HasField("radius"):
                user.geom_radius = request.radius.value

            if request.HasField("avatar_key"):
                user.avatar_key = request.avatar_key.value

            if request.HasField("gender"):
                user.gender = request.gender.value

            if request.HasField("pronouns"):
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

            if request.HasField("my_travels"):
                if request.my_travels.is_null:
                    user.my_travels = None
                else:
                    user.my_travels = request.my_travels.value

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
                user.hosting_status = hostingstatus2sql[request.hosting_status]

            if request.meetup_status != api_pb2.MEETUP_STATUS_UNSPECIFIED:
                user.meetup_status = meetupstatus2sql[request.meetup_status]

            if request.languages.exists:
                user.languages = "|".join(request.languages.value)

            if request.countries_visited.exists:
                user.countries_visited = "|".join(request.countries_visited.value)

            if request.countries_lived.exists:
                user.countries_lived = "|".join(request.countries_lived.value)

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

    def ListFriends(self, request, context):
        with session_scope() as session:
            rels = (
                session.query(FriendRelationship)
                .filter(
                    or_(
                        FriendRelationship.from_user_id == context.user_id,
                        FriendRelationship.to_user_id == context.user_id,
                    )
                )
                .filter(FriendRelationship.status == FriendStatus.accepted)
                .all()
            )
            return api_pb2.ListFriendsRes(
                user_ids=[rel.from_user.id if rel.from_user.id != context.user_id else rel.to_user.id for rel in rels],
            )

    def SendFriendRequest(self, request, context):
        with session_scope() as session:
            from_user = session.query(User).filter(User.id == context.user_id).one_or_none()

            if not from_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            to_user = session.query(User).filter(User.id == request.user_id).one_or_none()

            if not to_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            if get_friends_status(session, from_user.id, to_user.id) != api_pb2.User.FriendshipStatus.NOT_FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, errors.FRIENDS_ALREADY_OR_PENDING)

            # Race condition!

            friend_relationship = FriendRelationship(from_user=from_user, to_user=to_user, status=FriendStatus.pending)
            session.add(friend_relationship)

            send_friend_request_email(friend_relationship)

            return empty_pb2.Empty()

    def ListFriendRequests(self, request, context):
        # both sent and received
        with session_scope() as session:
            sent_requests = (
                session.query(FriendRelationship)
                .filter(FriendRelationship.from_user_id == context.user_id)
                .filter(FriendRelationship.status == FriendStatus.pending)
                .all()
            )

            received_requests = (
                session.query(FriendRelationship)
                .filter(FriendRelationship.to_user_id == context.user_id)
                .filter(FriendRelationship.status == FriendStatus.pending)
                .all()
            )

            return api_pb2.ListFriendRequestsRes(
                sent=[
                    api_pb2.FriendRequest(
                        friend_request_id=friend_request.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_request.to_user.id,
                    )
                    for friend_request in sent_requests
                ],
                received=[
                    api_pb2.FriendRequest(
                        friend_request_id=friend_request.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user_id=friend_request.from_user.id,
                    )
                    for friend_request in received_requests
                ],
            )

    def RespondFriendRequest(self, request, context):
        with session_scope() as session:
            friend_request = (
                session.query(FriendRelationship)
                .filter(FriendRelationship.to_user_id == context.user_id)
                .filter(FriendRelationship.status == FriendStatus.pending)
                .filter(FriendRelationship.id == request.friend_request_id)
                .one_or_none()
            )

            if not friend_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

            friend_request.status = FriendStatus.accepted if request.accept else FriendStatus.rejected
            friend_request.time_responded = func.now()

            session.commit()

            return empty_pb2.Empty()

    def CancelFriendRequest(self, request, context):
        with session_scope() as session:
            friend_request = (
                session.query(FriendRelationship)
                .filter(FriendRelationship.from_user_id == context.user_id)
                .filter(FriendRelationship.status == FriendStatus.pending)
                .filter(FriendRelationship.id == request.friend_request_id)
                .one_or_none()
            )

            if not friend_request:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.FRIEND_REQUEST_NOT_FOUND)

            friend_request.status = FriendStatus.cancelled
            friend_request.time_responded = func.now()

            session.commit()

            return empty_pb2.Empty()

    def Report(self, request, context):
        if context.user_id == request.reported_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANT_REPORT_SELF)

        with session_scope() as session:
            reported_user = session.query(User).filter(User.id == request.reported_user_id).one_or_none()

            if not reported_user:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.USER_NOT_FOUND)

            complaint = Complaint(
                author_user_id=context.user_id,
                reported_user_id=request.reported_user_id,
                reason=request.reason,
                description=request.description,
            )

            session.add(complaint)

            # commit here so that send_report_email can lazy-load stuff it needs
            session.commit()

            send_report_email(complaint)

            return empty_pb2.Empty()

    def WriteReference(self, request, context):
        if context.user_id == request.to_user_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Can't refer yourself")

        reference = Reference(
            from_user_id=context.user_id,
            to_user_id=request.to_user_id,
            reference_type=reftype2sql[request.reference_type],
            text=request.text,
            was_safe=request.was_safe,
            rating=request.rating,
        )
        with session_scope() as session:
            if not session.query(User).filter(User.id == request.to_user_id).one_or_none():
                context.abort(grpc.StatusCode.NOT_FOUND, "User not found")

            if (
                session.query(Reference)
                .filter(Reference.from_user_id == context.user_id)
                .filter(Reference.to_user_id == request.to_user_id)
                .filter(Reference.reference_type == reftype2sql[request.reference_type])
                .one_or_none()
            ):
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Reference already given")
            session.add(reference)
        return empty_pb2.Empty()

    def GetGivenReferences(self, request, context):
        with session_scope() as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id == request.from_user_id)
            if request.HasField("type_filter"):
                query = query.filter(Reference.reference_type == reftype2sql[request.type_filter.value])
            return paginate_references_result(request, query)

    def GetReceivedReferences(self, request, context):
        with session_scope() as session:
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
        with session_scope() as session:
            query = session.query(Reference)
            query = query.filter(Reference.from_user_id == context.user_id)
            query = query.filter(Reference.to_user_id == request.to_user_id)
            for reference in query.all():
                available.remove(reference.reference_type)

        # TODO: make surfing/hosted only available if you actually have been surfing/hosting
        return api_pb2.AvailableWriteReferenceTypesRes(reference_types=[reftype2api[r] for r in available])

    def InitiateMediaUpload(self, request, context):
        key = random_hex()

        created = now()
        expiry = created + timedelta(minutes=20)

        with session_scope() as session:
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

        data = urlsafe_b64encode(req).decode("utf8")
        sig = urlsafe_b64encode(generate_hash_signature(req, config["MEDIA_SERVER_SECRET_KEY"])).decode("utf8")

        path = "upload?" + urlencode({"data": data, "sig": sig})

        return api_pb2.InitiateMediaUploadRes(
            upload_url=urls.media_upload_url(path),
            expiry=Timestamp_from_datetime(expiry),
        )


def paginate_references_result(request, query):
    total_matches = query.count()
    references = query.order_by(Reference.time.desc()).offset(request.start_at).limit(request.number).all()
    # order by time, pagination
    return api_pb2.GetReferencesRes(
        total_matches=total_matches,
        references=[
            api_pb2.Reference(
                reference_id=reference.id,
                from_user_id=reference.from_user_id,
                to_user_id=reference.to_user_id,
                reference_type=reftype2api[reference.reference_type],
                text=reference.text,
                # Fuzz reference written time
                written_time=Timestamp_from_datetime(reference.time.replace(hour=0, minute=0, second=0, microsecond=0)),
            )
            for reference in references
        ],
    )


def user_model_to_pb(db_user, session, context):
    num_references = session.query(Reference.from_user_id).filter(Reference.to_user_id == db_user.id).count()

    # returns (lat, lng)
    # we put people without coords on null island
    # https://en.wikipedia.org/wiki/Null_Island
    lat, lng = db_user.coordinates or (0, 0)

    user = api_pb2.User(
        user_id=db_user.id,
        username=db_user.username,
        name=db_user.name,
        city=db_user.city,
        hometown=db_user.hometown,
        lat=lat,
        lng=lng,
        radius=db_user.geom_radius,
        verification=db_user.verification,
        community_standing=db_user.community_standing,
        num_references=num_references,
        gender=db_user.gender,
        pronouns=db_user.pronouns,
        age=db_user.age,
        joined=Timestamp_from_datetime(db_user.display_joined),
        last_active=Timestamp_from_datetime(db_user.display_last_active),
        hosting_status=hostingstatus2api[db_user.hosting_status],
        meetup_status=meetupstatus2api[db_user.meetup_status],
        occupation=db_user.occupation,
        education=db_user.education,
        about_me=db_user.about_me,
        my_travels=db_user.my_travels,
        things_i_like=db_user.things_i_like,
        about_place=db_user.about_place,
        languages=db_user.languages.split("|") if db_user.languages else [],
        countries_visited=db_user.countries_visited.split("|") if db_user.countries_visited else [],
        countries_lived=db_user.countries_lived.split("|") if db_user.countries_lived else [],
        additional_information=db_user.additional_information,
        friends=get_friends_status(session, context.user_id, db_user.id),
        mutual_friends=[
            api_pb2.MutualFriend(user_id=mutual_friend.id, username=mutual_friend.username, name=mutual_friend.name)
            for mutual_friend in db_user.mutual_friends(context.user_id)
        ],
        smoking_allowed=smokinglocation2api[db_user.smoking_allowed],
        sleeping_arrangement=sleepingarrangement2api[db_user.sleeping_arrangement],
        parking_details=parkingdetails2api[db_user.parking_details],
        avatar_url=db_user.avatar.thumbnail_url if db_user.avatar else None,
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
