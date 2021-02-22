from sqlalchemy.sql import func, or_, text

from couchers import errors
from couchers.db import session_scope
from couchers.models import Cluster, FriendRelationship, Page, PageType, PageVersion, User
from couchers.servicers.api import (
    hostingstatus2sql,
    parkingdetails2sql,
    sleepingarrangement2sql,
    smokinglocation2sql,
    user_model_to_pb,
)
from couchers.servicers.communities import community_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.utils import create_coordinate, to_aware_datetime
from pb import search_pb2, search_pb2_grpc

# searches are a bit expensive, we'd rather send back a bunch of results at once than lots of small pages
MAX_PAGINATION_LENGTH = 50

regconfig = "english"
TRI_SIMILARITY_THRESHOLD = 0.6
TRI_SIMILARITY_WEIGHT = 5


def _join_with_space(coalesces):
    if not coalesces:
        return ""
    out = coalesces[0]
    for coalesce in coalesces[1:]:
        out += " " + coalesce
    return out


def _build_tsv(A, B=[], C=[], D=[]):
    """
    Given lists for A, B, C, and D, builds a tsvector from them.
    """
    tsv = func.setweight(func.to_tsvector(regconfig, _join_with_space([func.coalesce(bit, "") for bit in A])), "A")
    if B:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(regconfig, _join_with_space([func.coalesce(bit, "") for bit in B])), "B")
        )
    if C:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(regconfig, _join_with_space([func.coalesce(bit, "") for bit in C])), "C")
        )
    if D:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(regconfig, _join_with_space([func.coalesce(bit, "") for bit in D])), "D")
        )
    return tsv


def _build_doc(A, B=[], C=[], D=[]):
    """
    Builds the raw document (without to_tsvector and weighting), used for extracting snippet
    """
    doc = _join_with_space([func.coalesce(bit, "") for bit in A])
    if B:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in B])
    if C:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in C])
    if D:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in D])
    return doc


def _similarity(query, text):
    return func.word_similarity(func.lower(func.unaccent(query)), func.lower(func.unaccent(text)))


def _gen_search_elements(query, title_only, next_rank, page_size, A, B=[], C=[], D=[]):
    """
    Given a query and four sets of fields, (A, B, C, D), generates a bunch of postgres expressions for full text search.

    The four sets are in decreasing order of "importance" for ranking.

    A should be the "title", the others can be anything.

    If title_only=True, we only perform a trigram search against A only
    """
    if not title_only:
        # a postgres tsquery object that can be used to match against a tsvector
        tsq = func.websearch_to_tsquery(regconfig, query)

        # the tsvector object that we want to search against with our tsquery
        tsv = _build_tsv(A, B, C, D)

        # document to generate snippet from
        doc = _build_doc(A, B, C, D)

        title = _build_doc(A)

        # trigram based text similarity between title and query string
        sim = _similarity(query, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = (TRI_SIMILARITY_WEIGHT * sim + func.ts_rank_cd(tsv, tsq)).label("rank")

        # the snippet with results highlighted
        snippet = func.ts_headline(regconfig, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def do_search_query(orig_query):
            """
            Does the right search filtering, limiting, and ordering for the query
            """
            return (
                orig_query.filter(or_(tsv.op("@@")(tsq), sim > TRI_SIMILARITY_THRESHOLD))
                .filter(rank <= next_rank if next_rank is not None else True)
                .order_by(rank.desc())
                .limit(page_size + 1)
                .all()
            )

    else:
        title = _build_doc(A)

        # trigram based text similarity between title and query string
        sim = _similarity(query, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = sim.label("rank")

        # used only for headline
        tsq = func.websearch_to_tsquery(regconfig, query)
        doc = _build_doc(A, B, C, D)

        # the snippet with results highlighted
        snippet = func.ts_headline(regconfig, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def do_search_query(orig_query):
            """
            Does the right search filtering, limiting, and ordering for the query
            """
            return (
                orig_query.filter(sim > TRI_SIMILARITY_THRESHOLD)
                .filter(rank <= next_rank if next_rank is not None else True)
                .order_by(rank.desc())
                .limit(page_size + 1)
                .all()
            )

    return rank, snippet, do_search_query


def _search_users(session, search_query, title_only, next_rank, page_size, context, include_users):
    if not include_users:
        return []
    rank, snippet, do_search_query = _gen_search_elements(
        search_query,
        title_only,
        next_rank,
        page_size,
        [User.username, User.name],
        [User.about_me, User.city],
        [User.my_travels, User.things_i_like, User.about_place, User.avatar_filename, User.additional_information],
    )

    users = do_search_query(session.query(User, rank, snippet).filter(~User.is_banned))

    return [
        search_pb2.Result(
            rank=rank,
            # TODO: user_model_to_pb should accept just user_id, not full context
            user=user_model_to_pb(page, session, context),
            snippet=snippet,
        )
        for page, rank, snippet in users
    ]


def _search_pages(session, search_query, title_only, next_rank, page_size, user_id, include_places, include_guides):
    rank, snippet, do_search_query = _gen_search_elements(
        search_query,
        title_only,
        next_rank,
        page_size,
        [PageVersion.title],
        [PageVersion.address],
        [PageVersion.content],
    )
    if not include_places and not include_guides:
        return []

    latest_pages = (
        session.query(func.max(PageVersion.id).label("id"))
        .join(Page, Page.id == PageVersion.page_id)
        .filter(
            or_(
                (Page.type == PageType.place) if include_places else False,
                (Page.type == PageType.guide) if include_guides else False,
            )
        )
        .group_by(PageVersion.page_id)
        .subquery()
    )

    pages = do_search_query(
        session.query(Page, rank, snippet)
        .join(PageVersion, PageVersion.page_id == Page.id)
        .join(latest_pages, latest_pages.c.id == PageVersion.id)
    )

    return [
        search_pb2.Result(
            rank=rank,
            place=page_to_pb(page, user_id) if page.type == PageType.place else None,
            guide=page_to_pb(page, user_id) if page.type == PageType.guide else None,
            snippet=snippet,
        )
        for page, rank, snippet in pages
    ]


def _search_clusters(
    session, search_query, title_only, next_rank, page_size, user_id, include_communities, include_groups
):
    if not include_communities and not include_groups:
        return []

    rank, snippet, do_search_query = _gen_search_elements(
        search_query,
        title_only,
        next_rank,
        page_size,
        [Cluster.name],
        [Cluster.description, PageVersion.title, PageVersion.address],
        [PageVersion.content],
    )

    latest_pages = (
        session.query(func.max(PageVersion.id).label("id"))
        .join(Page, Page.id == PageVersion.page_id)
        .filter(Page.type == PageType.main_page)
        .group_by(PageVersion.page_id)
        .subquery()
    )

    clusters = do_search_query(
        session.query(Cluster, rank, snippet)
        .join(Page, Page.owner_cluster_id == Cluster.id)
        .join(PageVersion, PageVersion.page_id == Page.id)
        .join(latest_pages, latest_pages.c.id == PageVersion.id)
        .filter(Cluster.is_official_cluster if include_communities and not include_groups else True)
        .filter(~Cluster.is_official_cluster if not include_communities and include_groups else True)
    )

    return [
        search_pb2.Result(
            rank=rank,
            community=community_to_pb(cluster.official_cluster_for_node, user_id)
            if cluster.is_official_cluster
            else None,
            group=group_to_pb(cluster, user_id) if not cluster.is_official_cluster else None,
            snippet=snippet,
        )
        for cluster, rank, snippet in clusters
    ]


class Search(search_pb2_grpc.SearchServicer):
    def Search(self, request, context):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # this is not an ideal page token, some results have equal rank (unlikely)
        next_rank = float(request.page_token) if request.page_token else None
        with session_scope() as session:
            all_results = (
                _search_users(
                    session,
                    request.query,
                    request.title_only,
                    next_rank,
                    page_size,
                    context,
                    request.include_users,
                )
                + _search_pages(
                    session,
                    request.query,
                    request.title_only,
                    next_rank,
                    page_size,
                    context.user_id,
                    request.include_places,
                    request.include_guides,
                )
                + _search_clusters(
                    session,
                    request.query,
                    request.title_only,
                    next_rank,
                    page_size,
                    context.user_id,
                    request.include_communities,
                    request.include_groups,
                )
            )
            all_results.sort(key=lambda result: result.rank, reverse=True)
            return search_pb2.SearchRes(
                results=all_results[:page_size],
                next_page_token=str(all_results[page_size].rank) if len(all_results) > page_size else None,
            )

    def UserSearch(self, request, context):
        with session_scope() as session:
            query = session.query(User).filter(~User.is_banned)
            if request.HasField("query"):
                if request.query_name_only:
                    query = query.filter(
                        or_(
                            User.name.ilike(f"%{request.query.value}%"), User.username.ilike(f"%{request.query.value}%")
                        )
                    )
                else:
                    query = query.filter(
                        or_(
                            User.name.ilike(f"%{request.query.value}%"),
                            User.username.ilike(f"%{request.query.value}%"),
                            User.city.ilike(f"%{request.query.value}%"),
                            User.hometown.ilike(f"%{request.query.value}%"),
                            User.about_me.ilike(f"%{request.query.value}%"),
                            User.my_travels.ilike(f"%{request.query.value}%"),
                            User.things_i_like.ilike(f"%{request.query.value}%"),
                            User.about_place.ilike(f"%{request.query.value}%"),
                            User.additional_information.ilike(f"%{request.query.value}%"),
                        )
                    )

            if request.HasField("last_active"):
                raw_dt = to_aware_datetime(request.last_active)
                coarsened_dt = raw_dt.replace(minute=(raw_dt.minute // 15) * 15, second=0, microsecond=0)
                query = query.filter(User.last_active >= coarsened_dt)

            if request.HasField("gender"):
                query = query.filter(User.gender.ilike(f"%{request.gender.value}%"))

            if len(request.hosting_status_filter) > 0:
                query = query.filter(
                    User.hosting_status.in_([hostingstatus2sql[status] for status in request.hosting_status_filter])
                )
            if len(request.smoking_location_filter) > 0:
                query = query.filter(
                    User.smoking_allowed.in_([smokinglocation2sql[loc] for loc in request.smoking_location_filter])
                )
            if len(request.sleeping_arrangement_filter) > 0:
                query = query.filter(
                    User.sleeping_arrangement.in_(
                        [sleepingarrangement2sql[arr] for arr in request.sleeping_arrangement_filter]
                    )
                )
            if len(request.parking_details_filter) > 0:
                query = query.filter(
                    User.parking_details.in_([parkingdetails2sql[det] for det in request.parking_details_filter])
                )

            if request.HasField("guests"):
                query = query.filter(User.max_guests >= request.guests.value)
            if request.HasField("last_minute"):
                query = query.filter(User.last_minute == last_minute.value)
            if request.HasField("has_pets"):
                query = query.filter(User.has_pets == has_pets.value)
            if request.HasField("accepts_pets"):
                query = query.filter(User.accepts_pets == accepts_pets.value)
            if request.HasField("has_kids"):
                query = query.filter(User.has_kids == has_kids.value)
            if request.HasField("accepts_kids"):
                query = query.filter(User.accepts_kids == accepts_kids.value)
            if request.HasField("has_housemates"):
                query = query.filter(User.has_housemates == has_housemates.value)
            if request.HasField("wheelchair_accessible"):
                query = query.filter(User.wheelchair_accessible == wheelchair_accessible.value)
            if request.HasField("smokes_at_home"):
                query = query.filter(User.smokes_at_home == smokes_at_home.value)
            if request.HasField("drinking_allowed"):
                query = query.filter(User.drinking_allowed == drinking_allowed.value)
            if request.HasField("drinks_at_home"):
                query = query.filter(User.drinks_at_home == drinks_at_home.value)
            if request.HasField("parking"):
                query = query.filter(User.parking == parking.value)
            if request.HasField("camping_ok"):
                query = query.filter(User.camping_ok == camping_ok.value)

            if request.HasField("search_in_area"):
                # EPSG4326 measures distance in meters
                # we want to check whether two circles overlap, so check if the distance between their centers is less
                # than the sum of their radii
                search_point = create_coordinate(request.search_in_area.lat, request.search_in_area.lng)
                query = query.filter(
                    func.ST_DWithin(User.geom, search_point, User.geom_radius + request.search_in_area.radius)
                )
            if request.HasField("search_in_community_id"):
                # could do a join here as well, but this is just simpler
                node = session.query(Node).filter(Node.id == request.search_in_community_id).one_or_none()
                if not node:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
                query = query.filter(func.ST_Contains(node.geom, User.geom))

            if request.only_with_references:
                query = query.join(Reference, Reference.to_user_id == User.id)

            # TODO:
            # google.protobuf.StringValue language = 11;
            # bool friends_only = 13;
            # google.protobuf.UInt32Value age_min = 14;
            # google.protobuf.UInt32Value age_max = 15;

            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_user_id = int(request.page_token) if request.page_token else 0

            users = query.filter(User.id >= next_user_id).order_by(User.id).limit(page_size + 1).all()

            return search_pb2.UserSearchRes(
                results=[
                    search_pb2.Result(
                        rank=1,
                        user=user_model_to_pb(user, session, context),
                    )
                    for user in users[:page_size]
                ],
                next_page_token=str(users[-1].id) if len(users) > page_size else None,
            )
