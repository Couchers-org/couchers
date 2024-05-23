"""
See //docs/search.md for overview.
"""

import grpc
from sqlalchemy.sql import func, or_

from couchers import errors
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.db import session_scope
from couchers.models import Cluster, Event, EventOccurrence, Node, Page, PageType, PageVersion, Reference, User
from couchers.servicers.api import (
    hostingstatus2sql,
    parkingdetails2sql,
    sleepingarrangement2sql,
    smokinglocation2sql,
    user_model_to_pb,
)
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import event_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.sql import couchers_select as select
from couchers.utils import create_coordinate, last_active_coarsen, to_aware_datetime
from proto import search_pb2, search_pb2_grpc

# searches are a bit expensive, we'd rather send back a bunch of results at once than lots of small pages
MAX_PAGINATION_LENGTH = 50

REGCONFIG = "english"
TRI_SIMILARITY_THRESHOLD = 0.6
TRI_SIMILARITY_WEIGHT = 5


def _join_with_space(coalesces):
    # the objects in coalesces are not strings, so we can't do " ".join(coalesces). They're SQLAlchemy magic.
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
    tsv = func.setweight(func.to_tsvector(REGCONFIG, _join_with_space([func.coalesce(bit, "") for bit in A])), "A")
    if B:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(REGCONFIG, _join_with_space([func.coalesce(bit, "") for bit in B])), "B")
        )
    if C:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(REGCONFIG, _join_with_space([func.coalesce(bit, "") for bit in C])), "C")
        )
    if D:
        tsv = tsv.concat(
            func.setweight(func.to_tsvector(REGCONFIG, _join_with_space([func.coalesce(bit, "") for bit in D])), "D")
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


def _similarity(statement, text):
    return func.word_similarity(func.unaccent(statement), func.unaccent(text))


def _gen_search_elements(statement, title_only, next_rank, page_size, A, B=[], C=[], D=[]):
    """
    Given an sql statement and four sets of fields, (A, B, C, D), generates a bunch of postgres expressions for full text search.

    The four sets are in decreasing order of "importance" for ranking.

    A should be the "title", the others can be anything.

    If title_only=True, we only perform a trigram search against A only
    """
    if not title_only:
        # a postgres tsquery object that can be used to match against a tsvector
        tsq = func.websearch_to_tsquery(REGCONFIG, statement)

        # the tsvector object that we want to search against with our tsquery
        tsv = _build_tsv(A, B, C, D)

        # document to generate snippet from
        doc = _build_doc(A, B, C, D)

        title = _build_doc(A)

        # trigram based text similarity between title and sql statement string
        sim = _similarity(statement, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = (TRI_SIMILARITY_WEIGHT * sim + func.ts_rank_cd(tsv, tsq)).label("rank")

        # the snippet with results highlighted
        snippet = func.ts_headline(REGCONFIG, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def execute_search_statement(session, orig_statement):
            """
            Does the right search filtering, limiting, and ordering for the initial statement
            """
            return session.execute(
                (
                    orig_statement.where(or_(tsv.op("@@")(tsq), sim > TRI_SIMILARITY_THRESHOLD))
                    .where(rank <= next_rank if next_rank is not None else True)
                    .order_by(rank.desc())
                    .limit(page_size + 1)
                )
            ).all()

    else:
        title = _build_doc(A)

        # trigram based text similarity between title and sql statement string
        sim = _similarity(statement, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = sim.label("rank")

        # used only for headline
        tsq = func.websearch_to_tsquery(REGCONFIG, statement)
        doc = _build_doc(A, B, C, D)

        # the snippet with results highlighted
        snippet = func.ts_headline(REGCONFIG, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def execute_search_statement(session, orig_statement):
            """
            Does the right search filtering, limiting, and ordering for the initial statement
            """
            return session.execute(
                (
                    orig_statement.where(sim > TRI_SIMILARITY_THRESHOLD)
                    .where(rank <= next_rank if next_rank is not None else True)
                    .order_by(rank.desc())
                    .limit(page_size + 1)
                )
            ).all()

    return rank, snippet, execute_search_statement


def _search_users(session, search_statement, title_only, next_rank, page_size, context, include_users):
    if not include_users:
        return []
    rank, snippet, execute_search_statement = _gen_search_elements(
        search_statement,
        title_only,
        next_rank,
        page_size,
        [User.username, User.name],
        [User.city],
        [User.about_me],
        [User.my_travels, User.things_i_like, User.about_place, User.additional_information],
    )

    users = execute_search_statement(session, select(User, rank, snippet).where_users_visible(context))

    return [
        search_pb2.Result(
            rank=rank,
            user=user_model_to_pb(page, session, context),
            snippet=snippet,
        )
        for page, rank, snippet in users
    ]


def _search_pages(session, search_statement, title_only, next_rank, page_size, context, include_places, include_guides):
    rank, snippet, execute_search_statement = _gen_search_elements(
        search_statement,
        title_only,
        next_rank,
        page_size,
        [PageVersion.title],
        [PageVersion.address],
        [],
        [PageVersion.content],
    )
    if not include_places and not include_guides:
        return []

    latest_pages = (
        select(func.max(PageVersion.id).label("id"))
        .join(Page, Page.id == PageVersion.page_id)
        .where(
            or_(
                (Page.type == PageType.place) if include_places else False,
                (Page.type == PageType.guide) if include_guides else False,
            )
        )
        .group_by(PageVersion.page_id)
        .subquery()
    )

    pages = execute_search_statement(
        session,
        select(Page, rank, snippet)
        .join(PageVersion, PageVersion.page_id == Page.id)
        .join(latest_pages, latest_pages.c.id == PageVersion.id),
    )

    return [
        search_pb2.Result(
            rank=rank,
            place=page_to_pb(page, context) if page.type == PageType.place else None,
            guide=page_to_pb(page, context) if page.type == PageType.guide else None,
            snippet=snippet,
        )
        for page, rank, snippet in pages
    ]


def _search_events(session, search_statement, title_only, next_rank, page_size, context):
    rank, snippet, execute_search_statement = _gen_search_elements(
        search_statement,
        title_only,
        next_rank,
        page_size,
        [Event.title],
        [EventOccurrence.address, EventOccurrence.link],
        [],
        [EventOccurrence.content],
    )

    occurrences = execute_search_statement(
        session,
        select(EventOccurrence, rank, snippet)
        .join(Event, Event.id == EventOccurrence.event_id)
        .where(EventOccurrence.end_time >= func.now()),
    )

    return [
        search_pb2.Result(
            rank=rank,
            event=event_to_pb(session, occurrence, context),
            snippet=snippet,
        )
        for occurrence, rank, snippet in occurrences
    ]


def _search_clusters(
    session, search_statement, title_only, next_rank, page_size, context, include_communities, include_groups
):
    if not include_communities and not include_groups:
        return []

    rank, snippet, execute_search_statement = _gen_search_elements(
        search_statement,
        title_only,
        next_rank,
        page_size,
        [Cluster.name],
        [PageVersion.address, PageVersion.title],
        [Cluster.description],
        [PageVersion.content],
    )

    latest_pages = (
        select(func.max(PageVersion.id).label("id"))
        .join(Page, Page.id == PageVersion.page_id)
        .where(Page.type == PageType.main_page)
        .group_by(PageVersion.page_id)
        .subquery()
    )

    clusters = execute_search_statement(
        session,
        select(Cluster, rank, snippet)
        .join(Page, Page.owner_cluster_id == Cluster.id)
        .join(PageVersion, PageVersion.page_id == Page.id)
        .join(latest_pages, latest_pages.c.id == PageVersion.id)
        .where(Cluster.is_official_cluster if include_communities and not include_groups else True)
        .where(~Cluster.is_official_cluster if not include_communities and include_groups else True),
    )

    return [
        search_pb2.Result(
            rank=rank,
            community=(
                community_to_pb(cluster.official_cluster_for_node, context) if cluster.is_official_cluster else None
            ),
            group=group_to_pb(cluster, context) if not cluster.is_official_cluster else None,
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
                    context,
                    request.include_places,
                    request.include_guides,
                )
                + _search_events(
                    session,
                    request.query,
                    request.title_only,
                    next_rank,
                    page_size,
                    context,
                )
                + _search_clusters(
                    session,
                    request.query,
                    request.title_only,
                    next_rank,
                    page_size,
                    context,
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
            statement = select(User).where_users_visible(context)
            if request.HasField("query"):
                if request.query_name_only:
                    statement = statement.where(
                        or_(
                            User.name.ilike(f"%{request.query.value}%"), User.username.ilike(f"%{request.query.value}%")
                        )
                    )
                else:
                    statement = statement.where(
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
            # if request.profile_completed:
            #     statement = statement.where(User.has_completed_profile == True)

            if request.HasField("last_active"):
                raw_dt = to_aware_datetime(request.last_active)
                statement = statement.where(User.last_active >= last_active_coarsen(raw_dt))

            if request.HasField("gender"):
                statement = statement.where(User.gender.ilike(f"%{request.gender.value}%"))

            if len(request.hosting_status_filter) > 0:
                statement = statement.where(
                    User.hosting_status.in_([hostingstatus2sql[status] for status in request.hosting_status_filter])
                )
            if len(request.smoking_location_filter) > 0:
                statement = statement.where(
                    User.smoking_allowed.in_([smokinglocation2sql[loc] for loc in request.smoking_location_filter])
                )
            if len(request.sleeping_arrangement_filter) > 0:
                statement = statement.where(
                    User.sleeping_arrangement.in_(
                        [sleepingarrangement2sql[arr] for arr in request.sleeping_arrangement_filter]
                    )
                )
            if len(request.parking_details_filter) > 0:
                statement = statement.where(
                    User.parking_details.in_([parkingdetails2sql[det] for det in request.parking_details_filter])
                )
            if request.HasField("profile_completed"):
                statement = statement.where(User.has_completed_profile == request.profile_completed.value)
            if request.HasField("guests"):
                statement = statement.where(User.max_guests >= request.guests.value)
            if request.HasField("last_minute"):
                statement = statement.where(User.last_minute == request.last_minute.value)
            if request.HasField("has_pets"):
                statement = statement.where(User.has_pets == request.has_pets.value)
            if request.HasField("accepts_pets"):
                statement = statement.where(User.accepts_pets == request.accepts_pets.value)
            if request.HasField("has_kids"):
                statement = statement.where(User.has_kids == request.has_kids.value)
            if request.HasField("accepts_kids"):
                statement = statement.where(User.accepts_kids == request.accepts_kids.value)
            if request.HasField("has_housemates"):
                statement = statement.where(User.has_housemates == request.has_housemates.value)
            if request.HasField("wheelchair_accessible"):
                statement = statement.where(User.wheelchair_accessible == request.wheelchair_accessible.value)
            if request.HasField("smokes_at_home"):
                statement = statement.where(User.smokes_at_home == request.smokes_at_home.value)
            if request.HasField("drinking_allowed"):
                statement = statement.where(User.drinking_allowed == request.drinking_allowed.value)
            if request.HasField("drinks_at_home"):
                statement = statement.where(User.drinks_at_home == request.drinks_at_home.value)
            if request.HasField("parking"):
                statement = statement.where(User.parking == request.parking.value)
            if request.HasField("camping_ok"):
                statement = statement.where(User.camping_ok == request.camping_ok.value)

            if request.HasField("search_in_area"):
                # EPSG4326 measures distance in decimal degress
                # we want to check whether two circles overlap, so check if the distance between their centers is less
                # than the sum of their radii, divided by 111111 m ~= 1 degree (at the equator)
                search_point = create_coordinate(request.search_in_area.lat, request.search_in_area.lng)
                statement = statement.where(
                    func.ST_DWithin(
                        # old:
                        # User.geom, search_point, (User.geom_radius + request.search_in_area.radius) / 111111
                        # this is an optimization that speeds up the db queries since it doesn't need to look up the user's geom radius
                        User.geom,
                        search_point,
                        (1000 + request.search_in_area.radius) / 111111,
                    )
                )
            if request.HasField("search_in_community_id"):
                # could do a join here as well, but this is just simpler
                node = session.execute(
                    select(Node).where(Node.id == request.search_in_community_id)
                ).scalar_one_or_none()
                if not node:
                    context.abort(grpc.StatusCode.NOT_FOUND, errors.COMMUNITY_NOT_FOUND)
                statement = statement.where(func.ST_Contains(node.geom, User.geom))

            if request.only_with_references:
                statement = statement.join(Reference, Reference.to_user_id == User.id)

            # TODO:
            # google.protobuf.StringValue language = 11;
            # bool friends_only = 13;
            # google.protobuf.UInt32Value age_min = 14;
            # google.protobuf.UInt32Value age_max = 15;

            page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
            next_recommendation_score = float(decrypt_page_token(request.page_token)) if request.page_token else 1e10

            statement = (
                statement.where(User.recommendation_score <= next_recommendation_score)
                .order_by(User.recommendation_score.desc())
                .limit(page_size + 1)
            )
            users = session.execute(statement).scalars().all()

            return search_pb2.UserSearchRes(
                results=[
                    search_pb2.Result(
                        rank=1,
                        user=user_model_to_pb(user, session, context),
                    )
                    for user in users[:page_size]
                ],
                next_page_token=(
                    encrypt_page_token(str(users[-1].recommendation_score)) if len(users) > page_size else None
                ),
            )
