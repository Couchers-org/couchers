import grpc

from couchers import errors
from couchers.couchers_select import couchers_select as select
from couchers.db import can_moderate_at, can_moderate_node, get_parent_node_at_location, session_scope
from couchers.models import Cluster, Node, Page, PageType, PageVersion, Thread, Upload, User
from couchers.servicers.threads import thread_to_pb
from couchers.utils import Timestamp_from_datetime, create_coordinate, remove_duplicates_retain_order
from proto import pages_pb2, pages_pb2_grpc

MAX_PAGINATION_LENGTH = 25

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


def _is_page_owner(page: Page, user_id):
    """
    Checks whether the user can act as an owner of the page
    """
    if page.owner_user:
        return page.owner_user_id == user_id
    # otherwise owned by a cluster
    return page.owner_cluster.admins.where(User.id == user_id).one_or_none() is not None


def _can_moderate_page(page: Page, user_id):
    """
    Checks if the user is allowed to moderate this page
    """
    # checks if either the page is in the exclusive moderation area of a node
    with session_scope() as session:
        latest_version = page.versions[-1]

        # if the page has a location, we firstly check if we are the moderator of any node that contains this page
        if latest_version.geom is not None and can_moderate_at(session, user_id, latest_version.geom):
            return True

        # if the page is owned by a cluster, then any moderator of that cluster can moderate this page
        if page.owner_cluster is not None and can_moderate_node(session, user_id, page.owner_cluster.parent_node_id):
            return True

        # finally check if the user can moderate the parent node of the cluster
        return can_moderate_node(session, user_id, page.parent_node_id)


def page_to_pb(page: Page, context):
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
        thread=thread_to_pb(page.thread_id),
        title=current_version.title,
        content=current_version.content,
        photo_url=current_version.photo.full_url if current_version.photo_key else None,
        address=current_version.address,
        location=pages_pb2.Coordinate(
            lat=current_version.coordinates[0],
            lng=current_version.coordinates[1],
        )
        if current_version.coordinates
        else None,
        editor_user_ids=remove_duplicates_retain_order([version.editor_user_id for version in page.versions]),
        can_edit=_is_page_owner(page, context.user_id),
        can_moderate=_can_moderate_page(page, context.user_id),
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
        if request.location.lat == 0 and request.location.lng == 0:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)

        geom = create_coordinate(request.location.lat, request.location.lng)

        with session_scope() as session:
            if (
                request.photo_key
                and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
            ):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

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
                photo_key=request.photo_key if request.photo_key else None,
                address=request.address,
                geom=geom,
            )
            session.add(page_version)
            session.commit()
            return page_to_pb(page, context)

    def CreateGuide(self, request, context):
        if not request.title:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_TITLE)
        if not request.content:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_CONTENT)
        if request.address and request.HasField("location"):
            address = request.address
            if request.location.lat == 0 and request.location.lng == 0:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.INVALID_COORDINATE)
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
            parent_node = session.execute(
                select(Node).where(Node.id == request.parent_community_id)
            ).scalar_one_or_none()

            if not parent_node:
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.COMMUNITY_NOT_FOUND)

            if (
                request.photo_key
                and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
            ):
                context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)

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
                photo_key=request.photo_key if request.photo_key else None,
                address=address,
                geom=geom,
            )
            session.add(page_version)
            session.commit()
            return page_to_pb(page, context)

    def GetPage(self, request, context):
        with session_scope() as session:
            page = session.execute(select(Page).where(Page.id == request.page_id)).scalar_one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            return page_to_pb(page, context)

    def UpdatePage(self, request, context):
        with session_scope() as session:
            page = session.execute(select(Page).where(Page.id == request.page_id)).scalar_one_or_none()
            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            if not _is_page_owner(page, context.user_id) and not _can_moderate_page(page, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.PAGE_UPDATE_PERMISSION_DENIED)

            current_version = page.versions[-1]

            page_version = PageVersion(
                page=page,
                editor_user_id=context.user_id,
                title=current_version.title,
                content=current_version.content,
                photo_key=current_version.photo_key,
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

            if request.HasField("photo_key"):
                if not request.photo_key.value:
                    page_version.photo_key = None
                else:
                    if not session.execute(
                        select(Upload).where(Upload.key == request.photo_key.value)
                    ).scalar_one_or_none():
                        context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.PHOTO_NOT_FOUND)
                    page_version.photo_key = request.photo_key.value

            if request.HasField("address"):
                if not request.address.value:
                    context.abort(grpc.StatusCode.INVALID_ARGUMENT, errors.MISSING_PAGE_ADDRESS)
                page_version.address = request.address.value

            if request.HasField("location"):
                page_version.geom = create_coordinate(request.location.lat, request.location.lng)

            session.add(page_version)
            session.commit()
            return page_to_pb(page, context)

    def TransferPage(self, request, context):
        with session_scope() as session:
            page = session.execute(
                select(Page).where(Page.id == request.page_id).where(Page.type != PageType.main_page)
            ).scalar_one_or_none()

            if not page:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.PAGE_NOT_FOUND)

            if not _is_page_owner(page, context.user_id) and not _can_moderate_page(page, context.user_id):
                context.abort(grpc.StatusCode.PERMISSION_DENIED, errors.PAGE_TRANSFER_PERMISSION_DENIED)

            if request.WhichOneof("new_owner") == "new_owner_group_id":
                cluster = session.execute(
                    select(Cluster).where(~Cluster.is_official_cluster).where(Cluster.id == request.new_owner_group_id)
                ).scalar_one_or_none()
            elif request.WhichOneof("new_owner") == "new_owner_community_id":
                cluster = session.execute(
                    select(Cluster)
                    .where(Cluster.parent_node_id == request.new_owner_community_id)
                    .where(Cluster.is_official_cluster)
                ).scalar_one_or_none()
            else:
                # i'm not sure if this needs to be checked
                context.abort(grpc.StatusCode.UNKNOWN, errors.UNKNOWN_ERROR)

            if not cluster:
                context.abort(grpc.StatusCode.NOT_FOUND, errors.GROUP_OR_COMMUNITY_NOT_FOUND)

            page.owner_user = None
            page.owner_cluster = cluster

            session.commit()
            return page_to_pb(page, context)

    def ListUserPlaces(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            user_id = request.user_id or context.user_id
            places = (
                session.execute(
                    select(Page)
                    .where(Page.owner_user_id == user_id)
                    .where(Page.type == PageType.place)
                    .where(Page.id >= next_page_id)
                    .order_by(Page.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return pages_pb2.ListUserPlacesRes(
                places=[page_to_pb(page, context) for page in places[:page_size]],
                next_page_token=str(places[-1].id) if len(places) > page_size else None,
            )

    def ListUserGuides(self, request, context):
        with session_scope() as session:
            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_page_id = int(request.page_token) if request.page_token else 0
            user_id = request.user_id or context.user_id
            guides = (
                session.execute(
                    select(Page)
                    .where(Page.owner_user_id == user_id)
                    .where(Page.type == PageType.guide)
                    .where(Page.id >= next_page_id)
                    .order_by(Page.id)
                    .limit(page_size + 1)
                )
                .scalars()
                .all()
            )
            return pages_pb2.ListUserGuidesRes(
                guides=[page_to_pb(page, context) for page in guides[:page_size]],
                next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
            )
