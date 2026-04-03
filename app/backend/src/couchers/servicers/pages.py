import grpc
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from couchers.context import CouchersContext
from couchers.db import can_moderate_at, can_moderate_node, get_parent_node_at_location
from couchers.models import Cluster, Node, Page, PageType, PageVersion, Thread, Upload, User
from couchers.proto import pages_pb2, pages_pb2_grpc
from couchers.servicers.threads import thread_to_pb
from couchers.utils import Timestamp_from_datetime, create_coordinate, not_none, remove_duplicates_retain_order

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


def _is_page_owner(page: Page, user_id: int) -> bool:
    """
    Checks whether the user can act as an owner of the page
    """
    if page.owner_user:
        return page.owner_user_id == user_id
    # otherwise owned by a cluster
    return not_none(page.owner_cluster).admins.where(User.id == user_id).one_or_none() is not None


def _can_moderate_page(session: Session, page: Page, user_id: int) -> bool:
    """
    Checks if the user is allowed to moderate this page
    """
    # checks if either the page is in the exclusive moderation area of a node
    latest_version = page.versions[-1]

    # if the page has a location, we firstly check if we are the moderator of any node that contains this page
    if latest_version.geom is not None and can_moderate_at(session, user_id, latest_version.geom):
        return True

    # if the page is owned by a cluster, then any moderator of that cluster can moderate this page
    if page.owner_cluster is not None and can_moderate_node(session, user_id, page.owner_cluster.parent_node_id):
        return True

    # finally check if the user can moderate the parent node of the cluster
    return can_moderate_node(session, user_id, page.parent_node_id)


def page_to_pb(session: Session, page: Page, context: CouchersContext) -> pages_pb2.Page:
    first_version = page.versions[0]
    current_version = page.versions[-1]

    owner_community_id = None
    owner_group_id = None
    if page.owner_cluster:
        if page.owner_cluster.is_official_cluster:
            owner_community_id = page.owner_cluster.parent_node_id
        else:
            owner_group_id = page.owner_cluster.id

    can_moderate = _can_moderate_page(session, page, context.user_id)

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
        thread=thread_to_pb(session, page.thread_id),
        title=current_version.title,
        content=current_version.content,
        photo_url=current_version.photo.full_url if current_version.photo_key else None,
        address=current_version.address,
        location=(
            pages_pb2.Coordinate(
                lat=current_version.coordinates[0],
                lng=current_version.coordinates[1],
            )
            if current_version.coordinates
            else None
        ),
        editor_user_ids=remove_duplicates_retain_order([version.editor_user_id for version in page.versions]),
        can_edit=_is_page_owner(page, context.user_id) or can_moderate,
        can_moderate=can_moderate,
    )


class Pages(pages_pb2_grpc.PagesServicer):
    def CreatePlace(
        self, request: pages_pb2.CreatePlaceReq, context: CouchersContext, session: Session
    ) -> pages_pb2.Page:
        if not request.title:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_title")
        if not request.content:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_content")
        if not request.address:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_address")
        if not request.HasField("location"):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_location")
        if request.location.lat == 0 and request.location.lng == 0:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")

        geom = create_coordinate(request.location.lat, request.location.lng)

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "photo_not_found")

        parent_node = get_parent_node_at_location(session, geom)
        if not parent_node:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "location_not_in_any_community")
        thread = Thread()
        session.add(thread)
        session.flush()
        page = Page(
            parent_node_id=parent_node.id,
            type=PageType.place,
            creator_user_id=context.user_id,
            owner_user_id=context.user_id,
            thread_id=thread.id,
        )
        session.add(page)
        session.flush()
        page_version = PageVersion(
            page_id=page.id,
            editor_user_id=context.user_id,
            title=request.title,
            content=request.content,
            photo_key=request.photo_key if request.photo_key else None,
            address=request.address,
            geom=geom,
        )
        session.add(page_version)
        session.commit()
        return page_to_pb(session, page, context)

    def CreateGuide(
        self, request: pages_pb2.CreateGuideReq, context: CouchersContext, session: Session
    ) -> pages_pb2.Page:
        if not request.title:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_title")
        if not request.content:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_content")
        if request.address and request.HasField("location"):
            address = request.address
            if request.location.lat == 0 and request.location.lng == 0:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_coordinate")
            geom = create_coordinate(request.location.lat, request.location.lng)
        elif not request.address and not request.HasField("location"):
            address = None
            geom = None
        else:
            # you have to have both or neither
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "invalid_guide_location")

        if not request.parent_community_id:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_parent")

        parent_node = session.execute(select(Node).where(Node.id == request.parent_community_id)).scalar_one_or_none()

        if not parent_node:
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "community_not_found")

        if (
            request.photo_key
            and not session.execute(select(Upload).where(Upload.key == request.photo_key)).scalar_one_or_none()
        ):
            context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "photo_not_found")

        thread = Thread()
        session.add(thread)
        session.flush()
        page = Page(
            parent_node_id=parent_node.id,
            type=PageType.guide,
            creator_user_id=context.user_id,
            owner_user_id=context.user_id,
            thread_id=thread.id,
        )
        session.add(page)
        session.flush()
        page_version = PageVersion(
            page_id=page.id,
            editor_user_id=context.user_id,
            title=request.title,
            content=request.content,
            photo_key=request.photo_key if request.photo_key else None,
            address=address,
            geom=geom,
        )
        session.add(page_version)
        session.commit()
        return page_to_pb(session, page, context)

    def GetPage(self, request: pages_pb2.GetPageReq, context: CouchersContext, session: Session) -> pages_pb2.Page:
        page = session.execute(
            select(Page)
            .where(Page.id == request.page_id)
            .options(selectinload(Page.versions), selectinload(Page.owner_cluster))
        ).scalar_one_or_none()
        if not page:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "page_not_found")

        return page_to_pb(session, page, context)

    def UpdatePage(
        self, request: pages_pb2.UpdatePageReq, context: CouchersContext, session: Session
    ) -> pages_pb2.Page:
        page = session.execute(select(Page).where(Page.id == request.page_id)).scalar_one_or_none()
        if not page:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "page_not_found")

        if not _is_page_owner(page, context.user_id) and not _can_moderate_page(session, page, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "page_update_permission_denied")

        current_version = page.versions[-1]

        page_version = PageVersion(
            page_id=page.id,
            editor_user_id=context.user_id,
            title=current_version.title,
            content=current_version.content,
            photo_key=current_version.photo_key,
            address=current_version.address,
            geom=current_version.geom,
        )

        if request.HasField("title"):
            if not request.title.value:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_title")
            page_version.title = request.title.value

        if request.HasField("content"):
            if not request.content.value:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_content")
            page_version.content = request.content.value

        if request.HasField("photo_key"):
            if not request.photo_key.value:
                page_version.photo_key = None
            else:
                if not session.execute(
                    select(Upload).where(Upload.key == request.photo_key.value)
                ).scalar_one_or_none():
                    context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "photo_not_found")
                page_version.photo_key = request.photo_key.value

        if request.HasField("address"):
            if not request.address.value:
                context.abort_with_error_code(grpc.StatusCode.INVALID_ARGUMENT, "missing_page_address")
            page_version.address = request.address.value

        if request.HasField("location"):
            page_version.geom = create_coordinate(request.location.lat, request.location.lng)

        session.add(page_version)
        session.commit()
        return page_to_pb(session, page, context)

    def TransferPage(
        self, request: pages_pb2.TransferPageReq, context: CouchersContext, session: Session
    ) -> pages_pb2.Page:
        page = session.execute(
            select(Page).where(Page.id == request.page_id).where(Page.type != PageType.main_page)
        ).scalar_one_or_none()

        if not page:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "page_not_found")

        if not _is_page_owner(page, context.user_id) and not _can_moderate_page(session, page, context.user_id):
            context.abort_with_error_code(grpc.StatusCode.PERMISSION_DENIED, "page_transfer_permission_denied")

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
            context.abort_with_error_code(grpc.StatusCode.UNKNOWN, "unknown_error")

        if not cluster:
            context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "group_or_community_not_found")

        page.owner_user = None
        page.owner_cluster = cluster

        session.commit()
        return page_to_pb(session, page, context)

    def ListUserPlaces(
        self, request: pages_pb2.ListUserPlacesReq, context: CouchersContext, session: Session
    ) -> pages_pb2.ListUserPlacesRes:
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
                .options(selectinload(Page.versions), selectinload(Page.owner_cluster))
            )
            .scalars()
            .all()
        )
        return pages_pb2.ListUserPlacesRes(
            places=[page_to_pb(session, page, context) for page in places[:page_size]],
            next_page_token=str(places[-1].id) if len(places) > page_size else None,
        )

    def ListUserGuides(
        self, request: pages_pb2.ListUserGuidesReq, context: CouchersContext, session: Session
    ) -> pages_pb2.ListUserGuidesRes:
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
                .options(selectinload(Page.versions), selectinload(Page.owner_cluster))
            )
            .scalars()
            .all()
        )
        return pages_pb2.ListUserGuidesRes(
            guides=[page_to_pb(session, page, context) for page in guides[:page_size]],
            next_page_token=str(guides[-1].id) if len(guides) > page_size else None,
        )
