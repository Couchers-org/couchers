import logging

import grpc

from couchers import errors
from couchers.db import session_scope
from couchers.models import Page, PageType, PageVersion, User
from couchers.utils import Timestamp_from_datetime, create_coordinate, slugify
from pb import pages_pb2, pages_pb2_grpc


def _check_update_permission(page: Page, user_id):
    if page.owner_user_id == user_id:
        return True
    # elif page.owner_cluster_id # TODO
    return False


def _page_to_pb(page: Page, user_id):
    first_version = page.versions[0]
    current_version = page.versions[-1]
    lat, lng = current_version.coordinates
    return pages_pb2.Page(
        page_id=page.id,
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
        address=None,  # TODO current_version.address,
        location=pages_pb2.Coordinate(
            lat=lat,
            lng=lng,
        ),
        # editor_user_ids=..., # TODO
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
        if not request.location.lat and not request.location.lng:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_LOCATION)

        with session_scope() as session:
            page = Page(
                type=PageType.point_of_interest,
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
                geom=create_coordinate(request.location.lat, request.location.lng),
            )
            session.add(page_version)
            session.commit()
            return _page_to_pb(page, context.user_id)

    def GetPage(self, request, context):
        with session_scope() as session:
            page = session.query(Page).filter(Page.id == request.page_id).one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            return _page_to_pb(page, context.user_id)

    def UpdatePage(self, request, context):
        with session_scope() as session:
            page = session.query(Page).filter(Page.id == request.page_id).one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            if not _check_update_permission(page, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.PAGE_UPDATE_PERMISSION_DENIED)

            version = page.versions[-1]

            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
            )

            if request.HasField("title"):
                if not request.title:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
                page_version.title = request.title

            if request.HasField("content"):
                if not request.content:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
                page_version.content = request.content

            if request.HasField("address"):
                if not request.address:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_ADDRESS)
                # page_version.address = request.address

            if request.HasField("location"):
                if not request.location.lat and not request.location.lng:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_LOCATION)

                page_version.geom = create_coordinate(request.location.lat, request.location.lng)

            session.commit()
            return _page_to_pb(page, context.user_id)
