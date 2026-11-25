from contextlib import contextmanager
from typing import cast

import grpc
from google.protobuf import wrappers_pb2

from couchers.proto import discussions_pb2, discussions_pb2_grpc
from couchers.servicers.discussions import Discussions
from tests.fixtures.misc import Moderator
from tests.fixtures.sessions import FakeChannel


def _string_value(value: str | None) -> wrappers_pb2.StringValue | None:
    return wrappers_pb2.StringValue(value=value) if value is not None else None


@contextmanager
def _discussions_session(token: str):
    channel = FakeChannel(token)
    discussions_pb2_grpc.add_DiscussionsServicer_to_server(Discussions(), cast(grpc.Server, channel))
    yield discussions_pb2_grpc.DiscussionsStub(cast(grpc.Channel, channel))


def create_discussion(
    *,
    token: str,
    title: str | None = "Dummy title",
    content: str | None = "Dummy content.",
    owner_community_id: int | None = None,
    owner_group_id: int | None = None,
    approve_by: Moderator | None = None,
) -> discussions_pb2.Discussion:
    with _discussions_session(token) as session:
        discussion: discussions_pb2.Discussion = session.CreateDiscussion(
            discussions_pb2.CreateDiscussionReq(
                title=title,
                content=content,
                owner_community_id=owner_community_id,
                owner_group_id=owner_group_id,
            )
        )

    if approve_by is not None:
        approve_by.approve_discussion(discussion.discussion_id)

    return discussion


def get_discussion(*, token: str, discussion_id: int) -> discussions_pb2.Discussion:
    with _discussions_session(token) as session:
        discussion: discussions_pb2.Discussion = session.GetDiscussion(
            discussions_pb2.GetDiscussionReq(discussion_id=discussion_id)
        )
    return discussion


def list_my_communities_discussions(
    *, token: str, page_size: int | None = None, page_token: str | None = None
) -> discussions_pb2.ListMyCommunitiesDiscussionsRes:
    with _discussions_session(token) as session:
        res: discussions_pb2.ListMyCommunitiesDiscussionsRes = session.ListMyCommunitiesDiscussions(
            discussions_pb2.ListMyCommunitiesDiscussionsReq(page_size=page_size, page_token=page_token)
        )
    return res


def update_discussion(
    *,
    token: str,
    discussion_id: int,
    # None leaves the field unchanged.
    title: str | None = None,
    content: str | None = None,
) -> discussions_pb2.Discussion:
    with _discussions_session(token) as session:
        discussion: discussions_pb2.Discussion = session.UpdateDiscussion(
            discussions_pb2.UpdateDiscussionReq(
                discussion_id=discussion_id,
                title=_string_value(title),
                content=_string_value(content),
            )
        )
    return discussion


def delete_discussion(*, token: str, discussion_id: int) -> None:
    with _discussions_session(token) as session:
        session.DeleteDiscussion(discussions_pb2.DeleteDiscussionReq(discussion_id=discussion_id))
