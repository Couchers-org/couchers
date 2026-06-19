from google.protobuf import empty_pb2
from sqlalchemy.orm import Session

from couchers.context import CouchersContext
from couchers.proto import (
    conversations_pb2,
    dashboard_pb2,
    dashboard_pb2_grpc,
    discussions_pb2,
    events_pb2,
    requests_pb2,
)
from couchers.servicers.account import Account
from couchers.servicers.discussions import Discussions
from couchers.servicers.events import Events
from couchers.servicers.requests import Requests

# the dashboard shows a small preview of each section
DASHBOARD_PAGE_SIZE = 3


class Dashboard(dashboard_pb2_grpc.DashboardServicer):
    def GetDashboardV2(
        self, request: dashboard_pb2.GetDashboardV2Req, context: CouchersContext, session: Session
    ) -> dashboard_pb2.GetDashboardV2Res:
        return dashboard_pb2.GetDashboardV2Res(
            reminders=Account().GetReminders(empty_pb2.Empty(), context, session),
            surfing=Requests().ListHostRequests(
                requests_pb2.ListHostRequestsReq(
                    only_sent=True,
                    only_active=True,
                    status_in=[
                        conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                        conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
                    ],
                    sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
                ),
                context,
                session,
            ),
            hosting=Requests().ListHostRequests(
                requests_pb2.ListHostRequestsReq(
                    only_received=True,
                    only_active=True,
                    status_in=[
                        conversations_pb2.HOST_REQUEST_STATUS_ACCEPTED,
                        conversations_pb2.HOST_REQUEST_STATUS_CONFIRMED,
                    ],
                    sort_by=requests_pb2.HOST_REQUEST_SORT_BY_FROM_DATE,
                ),
                context,
                session,
            ),
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
