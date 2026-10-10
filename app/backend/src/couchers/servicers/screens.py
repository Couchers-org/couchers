from google.protobuf import empty_pb2
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.proto import (
    discussions_pb2,
    events_pb2,
    messages_pb2,
    requests_pb2,
    screens_pb2,
    screens_pb2_grpc,
)
from couchers.servicers.account import Account
from couchers.servicers.discussions import Discussions
from couchers.servicers.events import Events
from couchers.servicers.requests import Requests

# the dashboard shows a small preview of each section
DASHBOARD_PAGE_SIZE = 3


class Screens(screens_pb2_grpc.ScreensServicer):
    def GetDashboard(
        self, request: screens_pb2.GetDashboardReq, context: CouchersContext, session: Session
    ) -> screens_pb2.GetDashboardRes:
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
            )

        return screens_pb2.GetDashboardRes(
            reminders=Account().GetReminders(empty_pb2.Empty(), context, session),
            surfing=Requests().ListHostRequests(upcoming_host_requests_req(surfing=True), context, session),
            hosting=Requests().ListHostRequests(upcoming_host_requests_req(surfing=False), context, session),
            my_events=Events().ListMyEvents(
                events_pb2.ListMyEventsReq(page_size=DASHBOARD_PAGE_SIZE),
                context,
                session,
            ),
            community_events=Events().ListMyEvents(
                events_pb2.ListMyEventsReq(
                    page_size=DASHBOARD_PAGE_SIZE,
                    my_communities=True,
                    my_communities_exclude_global=True,
                    exclude_attending=True,
                ),
                context,
                session,
            ),
            discussions=Discussions().ListMyCommunitiesDiscussions(
                discussions_pb2.ListMyCommunitiesDiscussionsReq(page_size=DASHBOARD_PAGE_SIZE),
                context,
                session,
            ),
        )
