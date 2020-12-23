from google.protobuf import empty_pb2
from sqlalchemy import select

from couchers.db import get_friends_status, session_scope
from couchers.models import Page, PageType, PageVersion, Thread
from couchers.utils import create_coordinate
from pb import api_pb2, pages_pb2, pages_pb2_grpc


class Pages(pages_pb2_grpc.PagesServicer):
    def CreatePage(self, request: pages_pb2.CreatePageReq, context):
        with session_scope() as session:
            page_id = Page.create(session, request.type, context.user_id)
        return pages_pb2.CreatePageRes(page_id=page_id)

    def EditPage(self, request: pages_pb2.EditPageReq, context):
        with session_scope() as session:
            page = session.query(Page).get(request.page_id)
            try:
                page.edit(context.user_id, **request)
            except Exception as e:
                if e.code == "ONLY_ADMIN_CAN_EDIT":
                    grpc_StatusCode = "PERMISSION_DENIED"
                else:
                    grpc_StatusCode = "UNKNOWN"
                context.abort(grpc.StatusCode[grpc_StatusCode], errors[e.code])
        return empty_pb2.Empty
