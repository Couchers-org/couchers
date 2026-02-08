"""
See //docs/search.md for an overview.
"""

from datetime import timedelta
from typing import Any, cast

import grpc
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.sql import and_, func, or_

from couchers import urls
from couchers.context import CouchersContext
from couchers.crypto import decrypt_page_token, encrypt_page_token
from couchers.event_log import log_event
from couchers.helpers.completed_profile import has_completed_profile_expression
from couchers.helpers.strong_verification import has_strong_verification
from couchers.materialized_views import LiteUser, UserResponseRate
from couchers.models import (
    Cluster,
    ClusterSubscription,
    Event,
    EventOccurrence,
    EventOccurrenceAttendee,
    EventOrganizer,
    EventSubscription,
    LanguageAbility,
    Node,
    Page,
    PageType,
    PageVersion,
    Reference,
    StrongVerificationAttempt,
    User,
)
from couchers.proto import search_pb2, search_pb2_grpc
from couchers.reranker import reranker
from couchers.servicers.api import (
    fluency2sql,
    get_num_references,
    hostingstatus2api,
    hostingstatus2sql,
    meetupstatus2api,
    meetupstatus2sql,
    parkingdetails2sql,
    response_rate_to_pb,
    sleepingarrangement2sql,
    smokinglocation2sql,
    user_model_to_pb,
)
from couchers.servicers.communities import community_to_pb
from couchers.servicers.events import event_to_pb
from couchers.servicers.groups import group_to_pb
from couchers.servicers.pages import page_to_pb
from couchers.sql import to_bool, users_visible, where_users_column_visible
from couchers.utils import (
    Timestamp_from_datetime,
    create_coordinate,
    dt_from_millis,
    get_coordinates,
    last_active_coarsen,
    millis_from_dt,
    now,
    to_aware_datetime,
)

# searches are a bit expensive, we'd rather send back a bunch of results at once than lots of small pages
MAX_PAGINATION_LENGTH = 100

REGCONFIG = "english"
TRI_SIMILARITY_THRESHOLD = 0.6
TRI_SIMILARITY_WEIGHT = 5


def _join_with_space(coalesces: list[Any]) -> Any:
    # the objects in coalesces are not strings, so we can't do " ".join(coalesces). They're SQLAlchemy magic.
    if not coalesces:
        return ""
    out = coalesces[0]
    for coalesce in coalesces[1:]:
        out += " " + coalesce
    return out


def _build_tsv(A: list[Any], B: list[Any] | None = None, C: list[Any] | None = None, D: list[Any] | None = None) -> Any:
    """
    Given lists for A, B, C, and D, builds a tsvector from them.
    """
    B = B or []
    C = C or []
    D = D or []
    tsv: Any = func.setweight(func.to_tsvector(REGCONFIG, _join_with_space([func.coalesce(bit, "") for bit in A])), "A")
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


def _build_doc(A: list[Any], B: list[Any] | None = None, C: list[Any] | None = None, D: list[Any] | None = None) -> Any:
    """
    Builds the raw document (without to_tsvector and weighting), used for extracting snippet
    """
    B = B or []
    C = C or []
    D = D or []
    doc = _join_with_space([func.coalesce(bit, "") for bit in A])
    if B:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in B])
    if C:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in C])
    if D:
        doc += " " + _join_with_space([func.coalesce(bit, "") for bit in D])
    return doc


def _similarity(statement: Any, text: str) -> Any:
    return func.word_similarity(func.unaccent(statement), func.unaccent(text))


def _gen_search_elements(
    statement: str,
    title_only: bool,
    next_rank: float | None,
    page_size: int,
    A: list[Any],
    B: list[Any] | None = None,
    C: list[Any] | None = None,
    D: list[Any] | None = None,
) -> tuple[Any, Any, Any]:
    """
    Given an sql statement and four sets of fields, (A, B, C, D), generates a bunch of postgres expressions for full text search.

    The four sets are in decreasing order of "importance" for ranking.

    A should be the "title", the others can be anything.

    If title_only=True, we only perform a trigram search against A only
    """
    B = B or []
    C = C or []
    D = D or []
    if not title_only:
        # a postgres tsquery object that can be used to match against a tsvector
        tsq = func.websearch_to_tsquery(REGCONFIG, statement)

        # the tsvector object that we want to search against with our tsquery
        tsv = _build_tsv(A, B, C, D)

        # document to generate snippet from
        doc = _build_doc(A, B, C, D)

        title = _build_doc(A)

        # trigram-based text similarity between title and sql statement string
        sim = _similarity(statement, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = (TRI_SIMILARITY_WEIGHT * sim + func.ts_rank_cd(tsv, tsq)).label("rank")

        # the snippet with results highlighted
        snippet = func.ts_headline(REGCONFIG, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def execute_search_statement(session: Session, orig_statement: Any) -> list[Any]:
            """
            Does the right search filtering, limiting, and ordering for the initial statement
            """
            query = (
                orig_statement.where(or_(tsv.op("@@")(tsq), sim > TRI_SIMILARITY_THRESHOLD))
                .where(rank <= next_rank if next_rank is not None else True)
                .order_by(rank.desc())
                .limit(page_size + 1)
            )
            return cast(list[Any], session.execute(query).all())

    else:
        title = _build_doc(A)

        # trigram-based text similarity between title and sql statement string
        sim = _similarity(statement, title)

        # ranking algo, weigh the similarity a lot, the text-based ranking less
        rank = sim.label("rank")

        # used only for headline
        tsq = func.websearch_to_tsquery(REGCONFIG, statement)
        doc = _build_doc(A, B, C, D)

        # the snippet with results highlighted
        snippet = func.ts_headline(REGCONFIG, doc, tsq, "StartSel=**,StopSel=**").label("snippet")

        def execute_search_statement(session: Session, orig_statement: Any) -> list[Any]:
            """
            Does the right search filtering, limiting, and ordering for the initial statement
            """
            query = (
                orig_statement.where(sim > TRI_SIMILARITY_THRESHOLD)
                .where(rank <= next_rank if next_rank is not None else True)
                .order_by(rank.desc())
                .limit(page_size + 1)
            )
            return cast(list[Any], session.execute(query).all())

    return rank, snippet, execute_search_statement


def _search_users(
    session: Session,
    search_statement: str,
    title_only: bool,
    next_rank: float | None,
    page_size: int,
    context: CouchersContext,
    include_users: bool,
) -> list[search_pb2.Result]:
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
        [User.things_i_like, User.about_place, User.additional_information],
    )

    users = execute_search_statement(session, select(User, rank, snippet).where(users_visible(context)))

    return [
        search_pb2.Result(
            rank=rank,
            user=user_model_to_pb(page, session, context),
            snippet=snippet,
        )
        for page, rank, snippet in users
    ]


def _search_pages(
    session: Session,
    search_statement: str,
    title_only: bool,
    next_rank: float | None,
    page_size: int,
    context: CouchersContext,
    include_places: bool,
    include_guides: bool,
) -> list[search_pb2.Result]:
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
                (Page.type == PageType.place) if include_places else to_bool(False),
                (Page.type == PageType.guide) if include_guides else to_bool(False),
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
            place=page_to_pb(session, page, context) if page.type == PageType.place else None,
            guide=page_to_pb(session, page, context) if page.type == PageType.guide else None,
            snippet=snippet,
        )
        for page, rank, snippet in pages
    ]


def _search_events(
    session: Session,
    search_statement: str,
    title_only: bool,
    next_rank: float | None,
    page_size: int,
    context: CouchersContext,
) -> list[search_pb2.Result]:
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
    session: Session,
    search_statement: str,
    title_only: bool,
    next_rank: float | None,
    page_size: int,
    context: CouchersContext,
    include_communities: bool,
    include_groups: bool,
) -> list[search_pb2.Result]:
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
        .where(Cluster.is_official_cluster if include_communities and not include_groups else to_bool(True))
        .where(~Cluster.is_official_cluster if not include_communities and include_groups else to_bool(True)),
    )

    return [
        search_pb2.Result(
            rank=rank,
            community=(
                community_to_pb(session, cluster.official_cluster_for_node, context)
                if cluster.is_official_cluster
                else None
            ),
            group=group_to_pb(session, cluster, context) if not cluster.is_official_cluster else None,
            snippet=snippet,
        )
        for cluster, rank, snippet in clusters
    ]


def _user_search_inner(
    request: search_pb2.UserSearchReq, context: CouchersContext, session: Session
) -> tuple[list[int], str | None, int]:
    user = session.execute(select(User).where(User.id == context.user_id)).scalar_one()

    # Base statement with visibility filter
    statement = select(User.id, User.recommendation_score).where(users_visible(context))
    # make sure that only users who are in LiteUser show up
    statement = statement.join(LiteUser, LiteUser.id == User.id)

    # If exactly_user_ids is present, only filter by those IDs and ignore all other filters
    # This is a bit of a hacky feature to help with the frontend map implementation
    if len(request.exactly_user_ids) > 0:
        statement = statement.where(User.id.in_(request.exactly_user_ids))
    else:
        # Apply all the normal filters
        if request.HasField("query"):
            if request.query_name_only:
                statement = statement.where(
                    or_(User.name.ilike(f"%{request.query.value}%"), User.username.ilike(f"%{request.query.value}%"))
                )
            else:
                statement = statement.where(
                    or_(
                        User.name.ilike(f"%{request.query.value}%"),
                        User.username.ilike(f"%{request.query.value}%"),
                        User.city.ilike(f"%{request.query.value}%"),
                        User.hometown.ilike(f"%{request.query.value}%"),
                        User.about_me.ilike(f"%{request.query.value}%"),
                        User.things_i_like.ilike(f"%{request.query.value}%"),
                        User.about_place.ilike(f"%{request.query.value}%"),
                        User.additional_information.ilike(f"%{request.query.value}%"),
                    )
                )

        if request.HasField("last_active"):
            raw_dt = to_aware_datetime(request.last_active)
            statement = statement.where(User.last_active >= last_active_coarsen(raw_dt))

        if request.same_gender_only:
            if not has_strong_verification(session, user):
                context.abort_with_error_code(grpc.StatusCode.FAILED_PRECONDITION, "need_strong_verification")
            statement = statement.where(User.gender == user.gender)

        if len(request.hosting_status_filter) > 0:
            statement = statement.where(
                User.hosting_status.in_([hostingstatus2sql[status] for status in request.hosting_status_filter])
            )
        if len(request.meetup_status_filter) > 0:
            statement = statement.where(
                User.meetup_status.in_([meetupstatus2sql[status] for status in request.meetup_status_filter])
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
        # limits/default could be handled on the front end as well
        min_age = request.age_min.value if request.HasField("age_min") else 18
        max_age = request.age_max.value if request.HasField("age_max") else 200

        statement = statement.where((User.age >= min_age) & (User.age <= max_age))

        # return results with by language code as only input
        # fluency in conversational or fluent

        if len(request.language_ability_filter) > 0:
            language_options = []
            for ability_filter in request.language_ability_filter:
                fluency_sql_value = fluency2sql.get(ability_filter.fluency)

                if fluency_sql_value is None:
                    continue
                language_options.append(
                    and_(
                        (LanguageAbility.language_code == ability_filter.code),
                        (LanguageAbility.fluency >= (fluency_sql_value)),
                    )
                )
            statement = statement.join(LanguageAbility, LanguageAbility.user_id == User.id)
            statement = statement.where(or_(*language_options))

        if request.HasField("profile_completed"):
            statement = statement.where(has_completed_profile_expression() == request.profile_completed.value)
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
                    # this is an optimization that speeds up the db queries since it doesn't need to look up the
                    # user's geom radius
                    User.geom,
                    search_point,
                    (1000 + request.search_in_area.radius) / 111111,
                )
            )
        if request.HasField("search_in_rectangle"):
            statement = statement.where(
                func.ST_Within(
                    User.geom,
                    func.ST_MakeEnvelope(
                        request.search_in_rectangle.lng_min,
                        request.search_in_rectangle.lat_min,
                        request.search_in_rectangle.lng_max,
                        request.search_in_rectangle.lat_max,
                        4326,
                    ),
                )
            )
        if request.HasField("search_in_community_id"):
            # could do a join here as well, but this is just simpler
            node = session.execute(select(Node).where(Node.id == request.search_in_community_id)).scalar_one_or_none()
            if not node:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
            statement = statement.where(func.ST_Contains(node.geom, User.geom))

        if request.only_with_references:
            references = (
                where_users_column_visible(
                    select(Reference.to_user_id.label("user_id")),
                    context,
                    Reference.from_user_id,
                )
                .distinct()
                .subquery()
            )
            statement = statement.join(references, references.c.user_id == User.id)

        if request.only_with_strong_verification:
            statement = statement.join(
                StrongVerificationAttempt,
                and_(
                    StrongVerificationAttempt.user_id == User.id,
                    StrongVerificationAttempt.has_strong_verification(User),
                ),
            )
        # TODO:
        # bool friends_only = 13;

    page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
    next_recommendation_score = float(decrypt_page_token(request.page_token)) if request.page_token else 1e10
    total_items = cast(int, session.execute(select(func.count()).select_from(statement.subquery())).scalar())

    statement = (
        statement.where(User.recommendation_score <= next_recommendation_score)
        .order_by(User.recommendation_score.desc())
        .limit(page_size + 1)
    )
    res = session.execute(statement).all()
    users: list[int] = []
    if res:
        users, rec_scores = zip(*res)  # type: ignore[assignment]

    next_page_token = encrypt_page_token(str(rec_scores[-1])) if len(users) > page_size else None
    return users[:page_size], next_page_token, total_items


class Search(search_pb2_grpc.SearchServicer):
    def Search(self, request: search_pb2.SearchReq, context: CouchersContext, session: Session) -> search_pb2.SearchRes:
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # this is not an ideal page token, some results have equal rank (unlikely)
        next_rank = float(request.page_token) if request.page_token else None

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

    def UserSearch(
        self, request: search_pb2.UserSearchReq, context: CouchersContext, session: Session
    ) -> search_pb2.UserSearchRes:
        user_ids_to_return, next_page_token, total_items = _user_search_inner(request, context, session)

        log_event(
            context,
            session,
            "search.performed",
            {
                "search_in": request.WhichOneof("search_in"),
                "has_query": request.HasField("query"),
                "has_filters": (
                    len(request.hosting_status_filter) > 0
                    or len(request.meetup_status_filter) > 0
                    or len(request.smoking_location_filter) > 0
                    or len(request.sleeping_arrangement_filter) > 0
                    or len(request.parking_details_filter) > 0
                    or len(request.language_ability_filter) > 0
                    or request.only_with_references
                    or request.only_with_strong_verification
                ),
                "total_items": total_items,
            },
        )

        user_ids_to_users: dict[int, User] = dict(
            session.execute(  # type: ignore[arg-type]
                select(User.id, User).where(User.id.in_(user_ids_to_return))
            ).all()
        )

        return search_pb2.UserSearchRes(
            results=[
                search_pb2.Result(
                    rank=1,
                    user=user_model_to_pb(user_ids_to_users[user_id], session, context),
                )
                for user_id in user_ids_to_return
            ],
            next_page_token=next_page_token,
            total_items=total_items,
        )

    def UserSearchV2(
        self, request: search_pb2.UserSearchReq, context: CouchersContext, session: Session
    ) -> search_pb2.UserSearchV2Res:
        user_ids_to_return, next_page_token, total_items = _user_search_inner(request, context, session)

        LiteUser_by_id = {
            lite_user.id: lite_user
            for lite_user in session.execute(select(LiteUser).where(LiteUser.id.in_(user_ids_to_return)))
            .scalars()
            .all()
        }

        response_rate_by_id = {
            resp_rate.user_id: resp_rate
            for resp_rate in session.execute(
                select(UserResponseRate).where(UserResponseRate.user_id.in_(user_ids_to_return))
            )
            .scalars()
            .all()
        }

        db_user_data_by_id = {
            user_id: (about_me, gender, last_active, hosting_status, meetup_status, joined)
            for user_id, about_me, gender, last_active, hosting_status, meetup_status, joined in session.execute(
                select(
                    User.id,
                    User.about_me,
                    User.gender,
                    User.last_active,
                    User.hosting_status,
                    User.meetup_status,
                    User.joined,
                ).where(User.id.in_(user_ids_to_return))
            ).all()
        }

        ref_counts_by_user_id = get_num_references(session, user_ids_to_return)

        def _user_to_search_user(user_id: int) -> search_pb2.SearchUser:
            lite_user = LiteUser_by_id[user_id]

            about_me, gender, last_active, hosting_status, meetup_status, joined = db_user_data_by_id[user_id]

            lat, lng = get_coordinates(lite_user.geom)
            return search_pb2.SearchUser(
                user_id=lite_user.id,
                username=lite_user.username,
                name=lite_user.name,
                city=lite_user.city,
                joined=Timestamp_from_datetime(last_active_coarsen(joined)),
                has_completed_profile=lite_user.has_completed_profile,
                has_completed_my_home=lite_user.has_completed_my_home,
                lat=lat,
                lng=lng,
                profile_snippet=about_me,
                num_references=ref_counts_by_user_id.get(lite_user.id, 0),
                gender=gender,
                age=int(lite_user.age),
                last_active=Timestamp_from_datetime(last_active_coarsen(last_active)),
                hosting_status=hostingstatus2api[hosting_status],
                meetup_status=meetupstatus2api[meetup_status],
                avatar_url=urls.media_url(filename=lite_user.avatar_filename, size="full")
                if lite_user.avatar_filename
                else None,
                avatar_thumbnail_url=urls.media_url(filename=lite_user.avatar_filename, size="thumbnail")
                if lite_user.avatar_filename
                else None,
                has_strong_verification=lite_user.has_strong_verification,
                **response_rate_to_pb(response_rate_by_id.get(user_id)),
            )

        results = reranker([_user_to_search_user(user_id) for user_id in user_ids_to_return])

        return search_pb2.UserSearchV2Res(
            results=results,
            next_page_token=next_page_token,
            total_items=total_items,
        )

    def EventSearch(
        self, request: search_pb2.EventSearchReq, context: CouchersContext, session: Session
    ) -> search_pb2.EventSearchRes:
        statement = (
            select(EventOccurrence).join(Event, Event.id == EventOccurrence.event_id).where(~EventOccurrence.is_deleted)
        )

        if request.HasField("query"):
            if request.query_title_only:
                statement = statement.where(Event.title.ilike(f"%{request.query.value}%"))
            else:
                statement = statement.where(
                    or_(
                        Event.title.ilike(f"%{request.query.value}%"),
                        EventOccurrence.content.ilike(f"%{request.query.value}%"),
                        EventOccurrence.address.ilike(f"%{request.query.value}%"),
                    )
                )

        if request.only_online:
            statement = statement.where(EventOccurrence.geom == None)
        elif request.only_offline:
            statement = statement.where(EventOccurrence.geom != None)

        if request.subscribed or request.attending or request.organizing or request.my_communities:
            where_ = []

            if request.subscribed:
                statement = statement.outerjoin(
                    EventSubscription,
                    and_(EventSubscription.event_id == Event.id, EventSubscription.user_id == context.user_id),
                )
                where_.append(EventSubscription.user_id != None)
            if request.organizing:
                statement = statement.outerjoin(
                    EventOrganizer,
                    and_(EventOrganizer.event_id == Event.id, EventOrganizer.user_id == context.user_id),
                )
                where_.append(EventOrganizer.user_id != None)
            if request.attending:
                statement = statement.outerjoin(
                    EventOccurrenceAttendee,
                    and_(
                        EventOccurrenceAttendee.occurrence_id == EventOccurrence.id,
                        EventOccurrenceAttendee.user_id == context.user_id,
                    ),
                )
                where_.append(EventOccurrenceAttendee.user_id != None)
            if request.my_communities:
                my_communities = (
                    session.execute(
                        select(Node.id)
                        .join(Cluster, Cluster.parent_node_id == Node.id)
                        .join(ClusterSubscription, ClusterSubscription.cluster_id == Cluster.id)
                        .where(ClusterSubscription.user_id == context.user_id)
                        .where(Cluster.is_official_cluster)
                        .order_by(Node.id)
                        .limit(100000)
                    )
                    .scalars()
                    .all()
                )
                where_.append(Event.parent_node_id.in_(my_communities))

            statement = statement.where(or_(*where_))

        if not request.include_cancelled:
            statement = statement.where(~EventOccurrence.is_cancelled)

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
                    EventOccurrence.geom,
                    search_point,
                    (1000 + request.search_in_area.radius) / 111111,
                )
            )
        if request.HasField("search_in_rectangle"):
            statement = statement.where(
                func.ST_Within(
                    EventOccurrence.geom,
                    func.ST_MakeEnvelope(
                        request.search_in_rectangle.lng_min,
                        request.search_in_rectangle.lat_min,
                        request.search_in_rectangle.lng_max,
                        request.search_in_rectangle.lat_max,
                        4326,
                    ),
                )
            )
        if request.HasField("search_in_community_id"):
            # could do a join here as well, but this is just simpler
            node = session.execute(select(Node).where(Node.id == request.search_in_community_id)).scalar_one_or_none()
            if not node:
                context.abort_with_error_code(grpc.StatusCode.NOT_FOUND, "community_not_found")
            statement = statement.where(func.ST_Contains(node.geom, EventOccurrence.geom))

        if request.HasField("after"):
            after_time = to_aware_datetime(request.after)
            statement = statement.where(EventOccurrence.start_time > after_time)
        if request.HasField("before"):
            before_time = to_aware_datetime(request.before)
            statement = statement.where(EventOccurrence.end_time < before_time)

        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        # the page token is a unix timestamp of where we left off
        page_token = (
            dt_from_millis(int(request.page_token)) if request.page_token and not request.page_number else now()
        )
        page_number = request.page_number or 1
        # Calculate the offset for pagination
        offset = (page_number - 1) * page_size

        if not request.past:
            cutoff = page_token - timedelta(seconds=1)
            statement = statement.where(EventOccurrence.end_time > cutoff).order_by(EventOccurrence.start_time.asc())
        else:
            cutoff = page_token + timedelta(seconds=1)
            statement = statement.where(EventOccurrence.end_time < cutoff).order_by(EventOccurrence.start_time.desc())

        total_items = session.execute(select(func.count()).select_from(statement.subquery())).scalar()
        # Apply pagination by page number
        statement = statement.offset(offset).limit(page_size) if request.page_number else statement.limit(page_size + 1)
        occurrences = session.execute(statement).scalars().all()

        return search_pb2.EventSearchRes(
            events=[event_to_pb(session, occurrence, context) for occurrence in occurrences[:page_size]],
            next_page_token=(str(millis_from_dt(occurrences[-1].end_time)) if len(occurrences) > page_size else None),
            total_items=total_items,
        )
