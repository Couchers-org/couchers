import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import Page, PageType, PageVersion, User
from couchers.utils import Timestamp_from_datetime, create_coordinate, remove_duplicates_retain_order, slugify
from pb import pages_pb2, pages_pb2_grpc


def _check_update_permission(page: Page, user_id):
    if page.owner_user_id == user_id:
        return True
    # elif page.owner_cluster_id # TODO
    return False


pagetype2sql = {
    pages_pb2.PAGE_TYPE_POI: PageType.point_of_interest,
    pages_pb2.PAGE_TYPE_GUIDE: PageType.guide,
    pages_pb2.PAGE_TYPE_MAIN_PAGE: PageType.main_page,
}

pagetype2api = {
    PageType.point_of_interest: pages_pb2.PAGE_TYPE_POI,
    PageType.guide: pages_pb2.PAGE_TYPE_GUIDE,
    PageType.main_page: pages_pb2.PAGE_TYPE_MAIN_PAGE,
}


def page_to_pb(page: Page, user_id):
    first_version = page.versions[0]
    current_version = page.versions[-1]
    lat, lng = current_version.coordinates or (0, 0)
    return pages_pb2.Page(
        page_id=page.id,
        type=pagetype2api[page.type],
        slug=slugify(current_version.title),
        created=Timestamp_from_datetime(first_version.created),
        last_edited=Timestamp_from_datetime(current_version.created),
        last_editor_user_id=current_version.editor_user_id,
        creator_user_id=page.creator_user_id,
        owner_user_id=page.owner_user_id,
        owner_cluster_id=page.owner_cluster_id,
        thread_id=None,  # TODO
        title=current_version.title,
        content=current_version.content,
        address=current_version.address,
        location=pages_pb2.Coordinate(
            lat=lat,
            lng=lng,
        ),
        editor_user_ids=remove_duplicates_retain_order([version.editor_user_id for version in page.versions]),
        can_edit=_check_update_permission(page, user_id),
    )


class Pages(pages_pb2_grpc.PagesServicer):
    def CreatePage(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
        if not request.address:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_ADDRESS)
        if not request.HasField("location"):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_LOCATION)
        if request.type not in [pages_pb2.PAGE_TYPE_POI, pages_pb2.PAGE_TYPE_GUIDE]:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.CANNOT_CREATE_PAGE_TYPE)

        with session_scope() as session:
            page = Page(
                type=pagetype2sql[request.type],
                creator_user_id=context.user_id,
                owner_user_id=context.user_id,
            )
            session.add(page)
            session.flush()
            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
                title=request.title,
                content=request.content,
                address=request.address,
                geom=create_coordinate(request.location.lat, request.location.lng),
            )
            session.add(page_version)
            session.commit()
            return page_to_pb(page, context.user_id)

    def GetPage(self, request, context):
        with session_scope() as session:
            page = session.query(Page).filter(Page.id == request.page_id).one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            return page_to_pb(page, context.user_id)

    def UpdatePage(self, request, context):
        with session_scope() as session:
            page = session.query(Page).filter(Page.id == request.page_id).one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            if not _check_update_permission(page, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.PAGE_UPDATE_PERMISSION_DENIED)

            current_version = page.versions[-1]

            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
                title=current_version.title,
                content=current_version.content,
                address=current_version.address,
                geom=current_version.geom,
            )

            if request.HasField("title"):
                if not request.title.value:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
                page_version.title = request.title.value

            if request.HasField("content"):
                if not request.content.value:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
                page_version.content = request.content.value

            if request.HasField("address"):
                if not request.address.value:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_ADDRESS)
                page_version.address = request.address.value

            if request.HasField("location"):
                page_version.geom = create_coordinate(request.location.lat, request.location.lng)

            session.commit()
            return page_to_pb(page, context.user_id)
