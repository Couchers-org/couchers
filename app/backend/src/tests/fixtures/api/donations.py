from contextlib import contextmanager
from typing import cast

import grpc
from google.protobuf import empty_pb2

from couchers.proto import donations_pb2, donations_pb2_grpc
from couchers.servicers.donations import Donations
from tests.fixtures.sessions import FakeChannel


@contextmanager
def _donations_session(token: str):
    channel = FakeChannel(token)
    donations_pb2_grpc.add_DonationsServicer_to_server(Donations(), cast(grpc.Server, channel))
    yield donations_pb2_grpc.DonationsStub(cast(grpc.Channel, channel))


def initiate_donation(
    *,
    token: str,
    amount: int,
    frequency: donations_pb2.DonationFrequency.ValueType = donations_pb2.DONATION_FREQUENCY_ONE_TIME,
    source: str | None = None,
) -> donations_pb2.InitiateDonationRes:
    with _donations_session(token) as session:
        res: donations_pb2.InitiateDonationRes = session.InitiateDonation(
            donations_pb2.InitiateDonationReq(amount=amount, frequency=frequency, source=source)
        )
    return res


def get_donation_portal_link(*, token: str) -> donations_pb2.GetDonationPortalLinkRes:
    with _donations_session(token) as session:
        res: donations_pb2.GetDonationPortalLinkRes = session.GetDonationPortalLink(empty_pb2.Empty())
    return res
