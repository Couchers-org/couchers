from sqlalchemy.sql import func, or_, text

from couchers import errors
from couchers.db import session_scope
from couchers.models import FriendRelationship, Page, PageType, PageVersion, User
from couchers.servicers.api import (
    hostingstatus2sql,
    parkingdetails2sql,
    sleepingarrangement2sql,
    smokinglocation2sql,
    user_model_to_pb,
)
from couchers.servicers.pages import page_to_pb
from couchers.utils import create_coordinate, to_aware_datetime
from pb import search_pb2, search_pb2_grpc

# searches are a bit expensive, we'd rather send back a bunch of results at once than lots of small pages
MAX_PAGINATION_LENGTH = 50


class Search(search_pb2_grpc.SearchServicer):
    def Search(self, request, context):
        page_size = min(MAX_PAGINATION_LENGTH, request.page_size or MAX_PAGINATION_LENGTH)
        next_rank = float(request.page_token) if request.page_token else None
        with session_scope() as session:

            # the SQL queries are something like the following:
            # tsv =
            # setweight(to_tsvector('english', coalesce(title,'')), 'A')   ||
            # setweight(to_tsvector('english', coalesce(address,'')), 'B') ||
            # setweight(to_tsvector('english', coalesce(content,'')), 'C');

            # SELECT
            #   title,
            #   ts_rank_cd(tsv, query) AS rank,
            #   ts_headline('english', coalesce(title,'') || ' ' || coalesce(address,'') || ' ' || coalesce(content,''), query, 'StartSel=*,StopSel=*') AS snippet
            # FROM page_versions, websearch_to_tsquery('english', 'city') query
            # WHERE query @@ tsv
            # ORDER BY rank DESC

            regconfig = "english"

            latest_pages = (
                session.query(func.max(PageVersion.id).label("id"))
                .join(Page, Page.id == PageVersion.page_id)
                .filter(or_(Page.type == PageType.place, Page.type == PageType.guide))
                .group_by(PageVersion.page_id)
                .subquery()
            )

            query = func.websearch_to_tsquery(regconfig, request.query)

            # the tsvector column that we want to search against for a PageVersion
            tsv = (
                func.setweight(func.to_tsvector(regconfig, func.coalesce(PageVersion.title, "")), "A")
                .concat(func.setweight(func.to_tsvector(regconfig, func.coalesce(PageVersion.address, "")), "B"))
                .concat(func.setweight(func.to_tsvector(regconfig, func.coalesce(PageVersion.content, "")), "C"))
            )

            rank = func.ts_rank_cd(tsv, query).label("rank")

            # document to generate snippet from
            doc = (
                func.coalesce(PageVersion.title, "")
                + " "
                + func.coalesce(PageVersion.address, "")
                + " "
                + func.coalesce(PageVersion.content, "")
            )

            snippet = func.ts_headline(regconfig, doc, query, "StartSel=**,StopSel=**").label("snippet")

            pages = (
                session.query(Page, rank, snippet)
                .join(PageVersion, PageVersion.page_id == Page.id)
                .join(latest_pages, latest_pages.c.id == PageVersion.id)
                .filter(tsv.op("@@")(query))
                .filter(rank <= next_rank if next_rank is not None else True)
                .order_by(rank.desc())
                .all()
            )

            page_results = [
                search_pb2.Result(
                    rank=rank,
                    place=page_to_pb(page, context.user_id) if page.type == PageType.place else None,
                    guide=page_to_pb(page, context.user_id) if page.type == PageType.guide else None,
                    snippet=snippet,
                )
                for page, rank, snippet in pages[:page_size]
            ]

            return search_pb2.SearchRes(
                results=page_results,
                next_page_token=str(page_results[page_size].rank) if len(page_results) > page_size else None,
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
