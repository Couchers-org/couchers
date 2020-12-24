from google.protobuf import empty_pb2
from sqlalchemy import select
from sqlalchemy.orm.session import Session

from couchers.db import get_friends_status, session_scope
from couchers.models import Page, PageType, PageVersion, Thread
from couchers.utils import create_coordinate
from pb import api_pb2, pages_pb2, pages_pb2_grpc


def _can_edit(page, user_id):
    if page.owner_user_id == user_id:
        return True
    else:
        subscriptions = page.owner_cluster.cluster_subscriptions
        admin_subscriptions = filter(lambda subscription: subscription.role == GroupRole.admin, subscriptions)
        admin_ids = map(lambda subscription: subscription.user_id, subscriptions)
        return user_id in admin_ids


def _edit_page(context, page, user_id, title, content, geom):
    if not _can_edit(page, user_id):
        context.abort(grpc.StatusCode["PERMISSION_DENIED"], "ONLY_ADMIN_CAN_EDIT")
    page_version = PageVersion(
        page_id=page.id,
        editor_user_id=user_id,
        title=title,
        content=content,
        geom=geom and create_coordinate(**geom),
    )
    session = Session.object_session(page)
    session.add(page_version)


class Pages(pages_pb2_grpc.PagesServicer):
    def CreatePage(page, request: pages_pb2.CreatePageReq, context):
        with session_scope() as session:
            thread = Thread(title="Threadtitle")
            page_type = PageType(request.type)
            session.add(thread)
            session.flush()
            page = Page(
                type=page_type, thread_id=thread.id, creator_user_id=context.user_id, owner_user_id=context.user_id
            )
            session.add(page)
            session.flush()
            _edit_page(context, page, context.user_id, "title", "content", None)
            page_id = page.id
        return pages_pb2.CreatePageRes(page_id=page_id)

    def EditPage(page, request: pages_pb2.EditPageReq, context):
        with session_scope() as session:
            page = session.query(Page).get(request.page_id)
            _edit_page(context, page, context.user_id, request.title, request.content, request.geom)
        return empty_pb2.Empty
