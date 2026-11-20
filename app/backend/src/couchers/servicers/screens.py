from google.protobuf import empty_pb2
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.proto import (
    discussions_pb2,
    events_pb2,
    messages_pb2,
    public_trips_pb2,
    requests_pb2,
    screens_pb2,
    screens_pb2_grpc,
)
from couchers.servicers.account import Account
from couchers.servicers.discussions import Discussions
from couchers.servicers.events import Events
from couchers.servicers.public_trips import PublicTrips
from couchers.servicers.requests import Requests


class Screens(screens_pb2_grpc.ScreensServicer):
    def GetDashboard(
        self, request: screens_pb2.GetDashboardReq, context: CouchersContext, session: Session
    ) -> screens_pb2.GetDashboardRes:
        # How many items each dashboard section returns. We want a few screens' worth rather than a single page.
        stays_page_size = 10
        my_events_page_size = 9
        community_events_page_size = 9
        discussions_page_size = 9
        public_trips_page_size = 10

        def upcoming_host_requests_req(*, surfing: bool) -> requests_pb2.ListHostRequestsReq:
            return requests_pb2.ListHostRequestsReq(
                only_sent=surfing,
                only_received=not surfing,
                only_active=True,
                status_in=[
                    messages_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                    messages_pb2.HOST_REQUEST_STATUS_CONFIRMED,
                ],
                sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
                number=stays_page_size,
            )

        my_public_trips = None
        community_public_trips = None
        if context.get_boolean_value("public_trips_enabled", default=False):
            my_public_trips = PublicTrips().ListPublicTripsByUser(
                public_trips_pb2.ListPublicTripsByUserReq(
                    user_id=context.user_id,
                    page_size=public_trips_page_size,
                    statuses_in=[public_trips_pb2.PUBLIC_TRIP_STATUS_SEARCHING_FOR_HOST],
                    ascending=True,
                ),
                context,
                session,
            )
            community_public_trips = PublicTrips().ListMyCommunitiesPublicTrips(
                public_trips_pb2.ListMyCommunitiesPublicTripsReq(page_size=public_trips_page_size),
                context,
                session,
            )

        return screens_pb2.GetDashboardRes(
            reminders=Account().GetReminders(empty_pb2.Empty(), context, session),
            surfing=Requests().ListHostRequests(upcoming_host_requests_req(surfing=True), context, session),
            hosting=Requests().ListHostRequests(upcoming_host_requests_req(surfing=False), context, session),
            my_events=Events().ListMyEvents(
                events_pb2.ListMyEventsReq(page_size=my_events_page_size, attending=True, organizing=True),
                context,
                session,
            ),
            community_events=Events().ListMyEvents(
                events_pb2.ListMyEventsReq(
                    page_size=community_events_page_size,
                    my_communities=True,
                    my_communities_exclude_global=True,
                    exclude_attending=True,
                ),
                context,
                session,
            ),
            discussions=Discussions().ListMyCommunitiesDiscussions(
                discussions_pb2.ListMyCommunitiesDiscussionsReq(page_size=discussions_page_size),
                context,
                session,
            ),
            my_public_trips=my_public_trips,
            community_public_trips=community_public_trips,
        )
