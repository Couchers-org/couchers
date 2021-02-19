import grpc

from couchers import errors
from couchers.db import get_parent_node_at_location, session_scope
from couchers.models import Cluster, Node, Page, PageType, PageVersion, Thread, User
from couchers.servicers.threads import pack_thread_id
from couchers.utils import Timestamp_from_datetime, create_coordinate, remove_duplicates_retain_order
from pb import pages_pb2, pages_pb2_grpc


def _check_update_permission(page: Page, user_id):
    if page.owner_user:
        return page.owner_user_id == user_id
    # otherwise owned by a cluster
    return page.owner_cluster.admins.filter(User.id == user_id).one_or_none() is not None


pagetype2sql = {
    pages_pb2.PAGE_TYPE_PLACE: PageType.place,
    pages_pb2.PAGE_TYPE_GUIDE: PageType.guide,
    pages_pb2.PAGE_TYPE_MAIN_PAGE: PageType.main_page,
}

pagetype2api = {
    PageType.place: pages_pb2.PAGE_TYPE_PLACE,
    PageType.guide: pages_pb2.PAGE_TYPE_GUIDE,
    PageType.main_page: pages_pb2.PAGE_TYPE_MAIN_PAGE,
}


def page_to_pb(page: Page, user_id):
    first_version = page.versions[0]
    current_version = page.versions[-1]

    owner_community_id = None
    owner_group_id = None
    if page.owner_cluster:
        if page.owner_cluster.is_official_cluster:
            owner_community_id = page.owner_cluster.parent_node_id
        else:
            owner_group_id = page.owner_cluster.id

    return pages_pb2.Page(
        page_id=page.id,
        type=pagetype2api[page.type],
        slug=current_version.slug,
        created=Timestamp_from_datetime(first_version.created),
        last_edited=Timestamp_from_datetime(current_version.created),
        last_editor_user_id=current_version.editor_user_id,
        creator_user_id=page.creator_user_id,
        owner_user_id=page.owner_user_id,
        owner_community_id=owner_community_id,
        owner_group_id=owner_group_id,
        thread_id=pack_thread_id(page.thread_id, 0),
        title=current_version.title,
        content=current_version.content,
        address=current_version.address,
        location=pages_pb2.Coordinate(
            lat=current_version.coordinates[0],
            lng=current_version.coordinates[1],
        )
        if current_version.coordinates
        else None,
        editor_user_ids=remove_duplicates_retain_order([version.editor_user_id for version in page.versions]),
        can_edit=_check_update_permission(page, user_id),
    )


class Pages(pages_pb2_grpc.PagesServicer):
    def CreatePlace(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
        if not request.address:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_ADDRESS)
        if not request.HasField("location"):
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_LOCATION)

        geom = create_coordinate(request.location.lat, request.location.lng)

        with session_scope() as session:
            page = Page(
                parent_node=get_parent_node_at_location(session, geom),
                type=PageType.place,
                creator_user_id=context.user_id,
                owner_user_id=context.user_id,
                thread=Thread(),
            )
            session.add(page)
            session.flush()
            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
                title=request.title,
                content=request.content,
                address=request.address,
                geom=geom,
            )
            session.add(page_version)
            session.commit()
            return page_to_pb(page, context.user_id)

    def CreateGuide(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
        if request.address and request.HasField("location"):
            address = request.address
            geom = create_coordinate(request.location.lat, request.location.lng)
        elif not request.address and not request.HasField("location"):
            address = None
            geom = None
        else:
            # you have to have both or neither
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_GUIDE_LOCATION)

        if not request.parent_community_id:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_PARENT)

        with session_scope() as session:
            parent_node = session.query(Node).filter(Node.id == request.parent_community_id).one_or_none()

            if not parent_node:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.COMMUNITY_NOT_FOUND)

            page = Page(
                parent_node=parent_node,
                type=PageType.guide,
                creator_user_id=context.user_id,
                owner_user_id=context.user_id,
                thread=Thread(),
            )
            session.add(page)
            session.flush()
            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
                title=request.title,
                content=request.content,
                address=address,
                geom=geom,
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

    def TransferPage(self, request, context):
        with session_scope() as session:
            page = (
                session.query(Page)
                .filter(Page.id == request.page_id)
                .filter(Page.type != PageType.main_page)
                .one_or_none()
            )

            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            if not page.owner_user_id == context.user_id:
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.PAGE_TRANSFER_PERMISSION_DENIED)

            if request.WhichOneof("new_owner") == "new_owner_group_id":
                cluster = (
                    session.query(Cluster)
                    .filter(~Cluster.is_official_cluster)
                    .filter(Cluster.id == request.new_owner_group_id)
                    .one_or_none()
                )
            elif request.WhichOneof("new_owner") == "new_owner_community_id":
                cluster = (
                    session.query(Cluster)
                    .filter(Cluster.parent_node_id == request.new_owner_community_id)
                    .filter(Cluster.is_official_cluster)
                    .one_or_none()
                )
            else:
                # i'm not sure if this needs to be checked
                context.abort(grpc.StatusCode.UNKNOWN, errors.UNKNOWN_ERROR)

            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

            page.owner_user = None
            page.owner_cluster = cluster

            session.commit()
            return page_to_pb(page, context.user_id)
