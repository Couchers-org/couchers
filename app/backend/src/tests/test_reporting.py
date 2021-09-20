import grpc
import pytest

from couchers import errors
from couchers.db import session_scope
from couchers.models import ContentReport
from couchers.sql import couchers_select as select
from proto import reporting_pb2
from tests.test_fixtures import db, generate_user, reporting_session, testconfig  # noqa


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_reporting(db):
    user1, token1 = generate_user()
    user2, token2 = generate_user()

    with reporting_session(token1) as api:
        res = api.Report(
            reporting_pb2.ReportReq(
                reason="spam",
                description="I think this is spam and does not belong on couchers",
                content_ref="comment/123",
                author_user=user2.username,
                user_agent="n/a",
                page="https://couchers.org/comment/123",
            )
        )

    with session_scope() as session:
        entries = session.execute(select(ContentReport)).scalars().all()

        assert len(entries) == 1

        assert entries[0].reporting_user_id == user1.id
        assert entries[0].reason == "spam"
        assert entries[0].description == "I think this is spam and does not belong on couchers"
        assert entries[0].content_ref == "comment/123"
        assert entries[0].author_user_id == user2.id
        assert entries[0].user_agent == "n/a"
        assert entries[0].page == "https://couchers.org/comment/123"

    # Test that reporting nonexisting user fails

    with reporting_session(token1) as api:
        with pytest.raises(grpc.RpcError) as e:
            api.Report(
                reporting_pb2.ReportReq(
                    reason="spam",
                    description="I think this is spam and does not belong on couchers",
                    content_ref="comment/123",
                    author_user="impossible username",
                    user_agent="n/a",
                    page="https://couchers.org/comment/123",
                )
            )
    assert e.value.code() == grpc.StatusCode.NOT_FOUND
    assert e.value.details() == errors.USER_NOT_FOUND
