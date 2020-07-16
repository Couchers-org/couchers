import datetime
import logging
from urllib.parse import parse_qs, quote, unquote, urlencode

from google.protobuf import empty_pb2
from google.protobuf.timestamp_pb2 import Timestamp

import grpc
from couchers.crypto import (base64decode, base64encode, sso_check_hmac,
                             sso_create_hmac)
from couchers.db import (get_friends_status, get_user_by_field, is_valid_name,
                         is_valid_color, session_scope)
from couchers.models import FriendRelationship, FriendStatus, User, Message, MessageThread, MessageThreadRole, MessageThreadSubscription, ThreadSubscriptionStatus
from couchers.utils import Timestamp_from_datetime
from pb import api_pb2, api_pb2_grpc
from sqlalchemy.sql import or_, and_, func
from sqlalchemy.orm import aliased

logging.basicConfig(format="%(asctime)s.%(msecs)03d: %(process)d: %(message)s",
                    datefmt="%F %T", level=logging.DEBUG)


class API(api_pb2_grpc.APIServicer):
    def __init__(self, Session):
        self._Session = Session

    def Ping(self, request, context):
        with session_scope(self._Session) as session:
            # auth ought to make sure the user exists
            user = session.query(User).filter(User.id == context.user_id).one()
            return api_pb2.PingRes(
                user_id=user.id,
                username=user.username,
                name=user.name,
                color=user.color
            )

    def GetUser(self, request, context):
        with session_scope(self._Session) as session:
            user = get_user_by_field(session, request.user)
            if not user:
                context.abort(grpc.StatusCode.NOT_FOUND, "No such user.")

            return api_pb2.User(
                username=user.username,
                name=user.name,
                city=user.city,
                verification=user.verification,
                community_standing=user.community_standing,
                num_references=0,
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
            )

    def UpdateProfile(self, request, context):
        with session_scope(self._Session) as session:
            user = session.query(User).filter(User.id == context.user_id).one()

            res = api_pb2.UpdateProfileRes()

            if request.HasField("name"):
                if not is_valid_name(request.name.value):
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                                  "Name not supported")
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
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Invalid color")
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
                users=[rel.from_user.username if rel.from_user.id != context.user_id else rel.to_user.username for rel in rels],
            )

    def SendFriendRequest(self, request, context):
        with session_scope(self._Session) as session:
            from_user = session.query(User).filter(User.id == context.user_id).one_or_none()

            if not from_user:
                context.abort(grpc.StatusCode.NOT_FOUND, "User not found.")

            to_user = get_user_by_field(session, request.user)

            if not to_user:
                context.abort(grpc.StatusCode.NOT_FOUND, "User not found.")

            if get_friends_status(session, from_user.id, to_user.id) != api_pb2.User.FriendshipStatus.NOT_FRIENDS:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can't send friend request. Already friends or pending.")

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
                        user=friend_request.to_user.username,
                    ) for friend_request in sent_requests
                ],
                received=[
                    api_pb2.FriendRequest(
                        friend_request_id=friend_request.id,
                        state=api_pb2.FriendRequest.FriendRequestStatus.PENDING,
                        user=friend_request.from_user.username,
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
                context.abort(grpc.StatusCode.NOT_FOUND, "Friend request not found.")

            friend_request.status = FriendStatus.accepted if request.accept else FriendStatus.rejected
            friend_request.time_responded = datetime.datetime.utcnow()

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
                context.abort(grpc.StatusCode.NOT_FOUND, "Friend request not found.")

            friend_request.status = FriendStatus.cancelled
            friend_request.time_responded = datetime.datetime.utcnow()

            session.commit()

            return empty_pb2.Empty()

    def SSO(self, request, context):
        # Protocol description: https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
        with session_scope(self._Session) as session:
            sso = request.sso
            sig = request.sig

            logging.info(f"Doing SSO login for {context.user_id=}, {sso=}, {sig=}")

            # TODO: secrets management, this is from sso-test instance
            hmac_sec = "b26c7ff6aa391b6a2ba2c0ad18cc6eae40c1a72e5355f86b7b35a4200b514709"

            if not sso_check_hmac(sso, hmac_sec, sig):
                context.abort(grpc.StatusCode.UNAUTHENTICATED, "Signature mismatch")

            # grab data from the "sso" string
            decoded_sso = base64decode(unquote(sso))
            parsed_query_string = parse_qs(decoded_sso)

            logging.info(f"SSO {parsed_query_string=}")

            nonce = parsed_query_string["nonce"][0]
            return_sso_url = parsed_query_string["return_sso_url"][0]

            user = session.query(User).filter(User.id == context.user_id).one()

            payload = {
                "nonce": nonce,
                "email": user.email,
                "external_id": user.id,
                "username": user.username,
                "name": user.name,
                #"admin": False
            }

            logging.info(f"SSO {payload=}")

            encoded_payload = base64encode(urlencode(payload))
            payload_sig = sso_create_hmac(encoded_payload, hmac_sec)

            query_string = urlencode({
                "sso": encoded_payload,
                "sig": payload_sig
            })

            redirect_url = f"{return_sso_url}?{query_string}"
            logging.info(f"SSO {redirect_url=}")

            return api_pb2.SSORes(redirect_url=redirect_url)

    def Search(self, request, context):
        with session_scope(self._Session) as session:
            return api_pb2.SearchRes(
                users=[
                    api_pb2.User(
                        username=user.username,
                        name=user.name,
                        city=user.city,
                        verification=user.verification,
                        community_standing=user.community_standing,
                        num_references=0,
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
                    ) for user in session.query(User) \
                        .filter(
                            or_(
                                User.name.ilike(f"%{request.query}%"),
                                User.username.ilike(f"%{request.query}%"),
                            )
                        ) \
                        .all()
                ]
            )

    def ListMessageThreads(self, request, context):
        start_index = request.start_index if request.start_index else 0
        with session_scope(self._Session) as session:
            subq1 = session.query(
                                  func.max(Message.timestamp).label("latest_message_timestamp")
                            ).group_by(
                                Message.thread_id
                            ).subquery()
            subq2 = session.query(Message.thread_id, Message.author_id, Message.text, Message.timestamp
                                 ).join(
                                     subq1, Message.timestamp==subq1.c.latest_message_timestamp
                                 ).subquery()
            message_subq = aliased(Message, subq2)
            query = session.query(MessageThread).join(
                MessageThread.messages.of_type(message_subq)
            ).join(
                MessageThread.recipient_subscriptions
            ).filter(
            # TODO: Decide if user-rejected threads should appear or not
            #and_(
                MessageThreadSubscription.user_id==context.user_id,
            #    MessageThreadSubscription.status!=ThreadSubscriptionStatus.rejected
            #)
            ).order_by(subq2.c.timestamp.desc())

            query = query.offset(start_index)
            has_more = False if not request.max or query.count() <= request.max else True
            if request.max:
                query = query.limit(request.max)
            threads = []
            for thread in query.all():
                subscription_status = None
                for subscription in thread.recipient_subscriptions:
                    if subscription.user_id == context.user_id:
                        if subscription.status == ThreadSubscriptionStatus.accepted:
                            subscription_status = api_pb2.MessageThreadStatus.ACCEPTED
                        elif subscription.status == ThreadSubscriptionStatus.pending:
                            subscription_status = api_pb2.MessageThreadStatus.PENDING
                        elif subscription.status == ThreadSubscriptionStatus.rejected:
                            subscription_status = api_pb2.MessageThreadStatus.REJECTED
                threads.append(api_pb2.MessageThreadPreview(
                    thread_id=thread.id,
                    title=thread.title,
                    # TODO: Should recipients actually be a username/photo/displayname combo?
                    recipients=map(lambda e: str(e.user_id),
                                   thread.recipient_subscriptions),
                    is_dm=thread.is_dm,
                    creation_time=Timestamp_from_datetime(thread.creation_time),
                    status=subscription_status,
                    latest_message_preview=thread.messages[0].text,
                    latest_message_sender=thread.messages[0].author.username,
                    latest_message_time=Timestamp_from_datetime(
                        thread.messages[0].timestamp),
                ))
            return api_pb2.ListMessageThreadsRes(
                start_index=start_index,
                threads=threads,
                has_more=has_more
            )

    def CreateMessageThread(self, request, context):
        if len(request.recipients) < 1:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "No recipients")
        with session_scope(self._Session) as session:
            thread = MessageThread(
                title=request.title.value,
                creator_id=context.user_id,
                is_dm=True if len(request.recipients) == 1 else False
            )
            session.add(thread)
            session.flush()
            sub = MessageThreadSubscription(
                user_id=context.user_id,
                thread_id=thread.id,
                role=MessageThreadRole.admin,
                status=ThreadSubscriptionStatus.accepted,
                added_by_id=context.user_id
            )
            session.add(sub)
            for recipient in request.recipients:
                r_user = get_user_by_field(session, recipient)
                if not r_user:
                    context.abort(grpc.StatusCode.NOT_FOUND, "No such user.")
                r_id = r_user.id
                sub = MessageThreadSubscription(
                    user_id=r_id,
                    thread_id=thread.id,
                    role=MessageThreadRole.participant,
                    status=(ThreadSubscriptionStatus.accepted
                            if get_friends_status(session, context.user_id, r_id)
                            == api_pb2.User.FriendshipStatus.FRIENDS
                            else ThreadSubscriptionStatus.pending),
                    added_by_id=context.user_id
                )
                session.add(sub)
            session.commit()
            return api_pb2.CreateMessageThreadRes(thread_id=thread.id)

    def SendMessage(self, request, context):
        if not request.thread_id or not request.message:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            if session.query(MessageThread).filter_by(id=request.thread_id).count() < 1:
                context.abort(grpc.StatusCode.NOT_FOUND,
                              "No matching message thread found.")
            session.add(Message(
                thread_id=request.thread_id,
                author_id=context.user_id,
                text=request.message
            ))
            session.commit()
            return empty_pb2.Empty()


    def EditMessageThreadStatus(self, request, context):
        if not request.thread_id or not request.status:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        status = None
        # TODO: Is this the behaviour we want?
        if request.status == api_pb2.MessageThreadStatus.PENDING:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can't set a thread to pending status.")
        elif request.status == api_pb2.MessageThreadStatus.ACCEPTED:
            status = ThreadSubscriptionStatus.accepted
        elif request.status == api_pb2.MessageThreadStatus.REJECTED:
            status = ThreadSubscriptionStatus.rejected
        else:
            context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
        with session_scope(self._Session) as session:
            subscription = session.query(MessageThreadSubscription).filter(
                and_(MessageThreadSubscription.thread_id == request.thread_id,
                     MessageThreadSubscription.user_id == context.user_id)
            ).one_or_none()
            if not subscription:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")
            if subscription.status != ThreadSubscriptionStatus.pending:
                context.abort(grpc.StatusCode.FAILED_PRECONDITION, "Can only set a pending thread status.")
            subscription.status = status
            session.commit()
            return empty_pb2.Empty()
    
    def GetMessageThreadInfo(self, request, context):
        if not request.thread_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT,
                          "Missing request argument")
        with session_scope(self._Session) as session:
            thread = session.query(MessageThread).join(
                MessageThreadSubscription
            ).filter(
                and_(MessageThread.id == request.thread_id,
                     MessageThread.recipient_subscriptions.any(user_id=context.user_id))
            ).one_or_none()
            if not thread:
                context.abort(grpc.StatusCode.NOT_FOUND, "Couldn't find that thread for this user.")

            status = None
            for sub in thread.recipient_subscriptions:
                if sub.user_id == context.user_id:
                    if sub.status == ThreadSubscriptionStatus.pending:
                        status = api_pb2.MessageThreadStatus.PENDING
                    elif sub.status == ThreadSubscriptionStatus.accepted:
                        status = api_pb2.MessageThreadStatus.ACCEPTED
                    elif sub.status == ThreadSubscriptionStatus.rejected:
                        status = api_pb2.MessageThreadStatus.REJECTED
                    else:
                        context.abort(grpc.StatusCode.UNIMPLEMENTED, "Unknown thread status.")
                    break

            return api_pb2.GetMessageThreadInfoRes(
                title=thread.title,
                recipients=map(lambda r: str(r.user_id), thread.recipient_subscriptions),
                admins=[ str(r.user_id) for r in thread.recipient_subscriptions if r is not None ],
                creation_time=Timestamp_from_datetime(thread.creation_time),
                only_admins_invite=thread.only_admins_invite,
                status=status,
                is_dm=thread.is_dm
            )

  
"""def GetMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def EditMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def MakeMessageThreadAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def RemoveMessageThreadAdmin(self, request, context):
    with session_scope(self._Session) as session:
  
  def LeaveMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def InviteToMessageThread(self, request, context):
    with session_scope(self._Session) as session:
  
  def SearchMessages(self, request, context):
    with session_scope(self._Session) as session:"""
