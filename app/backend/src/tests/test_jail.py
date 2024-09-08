import grpc
import pytest
from google.protobuf import empty_pb2

from couchers import errors, models
from couchers.constants import TOS_VERSION
from couchers.servicers import jail as servicers_jail
from couchers.utils import to_aware_datetime
from proto import admin_pb2, api_pb2, jail_pb2
from tests.test_fixtures import (  # noqa  # noqa
    db,
    email_fields,
    fast_passwords,
    generate_user,
    mock_notification_email,
    push_collector,
    real_account_session,
    real_admin_session,
    real_api_session,
    real_jail_session,
    testconfig,
)


@pytest.fixture(autouse=True)
def _(testconfig):
    pass


def test_jail_basic(db):
    user1, token1 = generate_user()

    with real_api_session(token1) as api:
        res = api.Ping(api_pb2.PingReq())

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        # check every field is false
        for field in res.DESCRIPTOR.fields:
            assert not getattr(res, field.name)

        assert not res.jailed

    # make the user jailed
    user2, token2 = generate_user(accepted_tos=0)

    with real_api_session(token2) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())

        assert res.jailed

        reason_count = 0

        # check at least one field is true
        for field in res.DESCRIPTOR.fields:
            reason_count += getattr(res, field.name) == True

        assert reason_count > 0


def test_JailInfo(db):
    user1, token1 = generate_user(accepted_tos=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

    with real_api_session(token1) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    # make the user not jailed
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

    with real_api_session(token2) as api:
        res = api.Ping(api_pb2.PingReq())


def test_AcceptTOS(db):
    # make them have not accepted TOS
    user1, token1 = generate_user(accepted_tos=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # now accept
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

    # make them have accepted TOS
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_TOS

        # accepting again doesn't do anything
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos


def test_TOS_increase(db, monkeypatch):
    # test if the TOS version is updated

    # not jailed yet
    user, token = generate_user()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos

    with real_api_session(token) as api:
        res = api.Ping(api_pb2.PingReq())

    # now we pretend to update the TOS version
    new_TOS_VERSION = TOS_VERSION + 1

    monkeypatch.setattr(models, "TOS_VERSION", new_TOS_VERSION)
    monkeypatch.setattr(servicers_jail, "TOS_VERSION", new_TOS_VERSION)

    # make sure we're jailed
    with real_api_session(token) as api, pytest.raises(grpc.RpcError) as e:
        res = api.Ping(api_pb2.PingReq())
    assert e.value.code() == grpc.StatusCode.UNAUTHENTICATED

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_tos

        # now accept
        res = jail.AcceptTOS(jail_pb2.AcceptTOSReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_tos


def test_SetLocation(db):
    # make them have not added a location
    user1, token1 = generate_user(geom=None, geom_radius=None)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_added_location

        res = jail.SetLocation(
            jail_pb2.SetLocationReq(
                city="New York City",
                lat=40.7812,
                lng=-73.9647,
                radius=250,
            )
        )

        assert not res.jailed
        assert not res.has_not_added_location

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_added_location


def test_AcceptCommunityGuidelines(db):
    # make them have not accepted GC
    user1, token1 = generate_user(accepted_community_guidelines=0)

    with real_jail_session(token1) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_not_accepted_community_guidelines

        # now accept
        res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

    # make them have accepted GC
    user2, token2 = generate_user()

    with real_jail_session(token2) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines

        # make sure we can't unaccept
        with pytest.raises(grpc.RpcError) as e:
            res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=False))
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.CANT_UNACCEPT_COMMUNITY_GUIDELINES

        # accepting again doesn't do anything
        res = jail.AcceptCommunityGuidelines(jail_pb2.AcceptCommunityGuidelinesReq(accept=True))

        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_not_accepted_community_guidelines


def test_modnotes(db, push_collector):
    user, token = generate_user()
    super_user, super_token = generate_user(is_superuser=True)

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 0

    with real_account_session(token) as account:
        res = account.ListModNotes(empty_pb2.Empty())
        assert len(res.mod_notes) == 0

    with real_admin_session(super_token) as admin:
        with mock_notification_email() as mock:
            admin.SendModNote(
                admin_pb2.SendModNoteReq(
                    user=user.username,
                    content="# Important note\nThis is a sample mod note.",
                    internal_id="sample_note",
                )
            )
        mock.assert_called_once()
        e = email_fields(mock)

        assert e.subject == "[TEST] You have received a mod note"
        push_collector.assert_user_has_single_matching(
            user.id,
            title="You received a mod note",
            body="You need to read and acknowledge the note before continuing to use the platform.",
        )

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 1
        note = res.pending_mod_notes[0]
        assert note.note_content == "# Important note\nThis is a sample mod note."

        note_id = note.note_id

        with pytest.raises(grpc.RpcError) as e:
            jail.AcknowledgePendingModNote(
                jail_pb2.AcknowledgePendingModNoteReq(
                    note_id=note_id,
                    acknowledge=False,
                )
            )
        assert e.value.code() == grpc.StatusCode.FAILED_PRECONDITION
        assert e.value.details() == errors.MOD_NOTE_NEED_TO_ACKNOWELDGE

        assert res.jailed
        assert res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 1
        note = res.pending_mod_notes[0]
        assert note.note_content == "# Important note\nThis is a sample mod note."

        res = jail.AcknowledgePendingModNote(
            jail_pb2.AcknowledgePendingModNoteReq(
                note_id=note_id,
                acknowledge=True,
            )
        )
        assert not res.jailed
        assert not res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 0

        with pytest.raises(grpc.RpcError) as e:
            jail.AcknowledgePendingModNote(
                jail_pb2.AcknowledgePendingModNoteReq(
                    note_id=note_id,
                    acknowledge=False,
                )
            )
        assert e.value.code() == grpc.StatusCode.NOT_FOUND
        assert e.value.details() == errors.MOD_NOTE_NOT_FOUND

    with real_account_session(token) as account:
        res = account.ListModNotes(empty_pb2.Empty())
        assert len(res.mod_notes) == 1
        note = res.mod_notes[0]
        assert note.note_id == note_id
        assert note.note_content == "# Important note\nThis is a sample mod note."

        assert to_aware_datetime(note.acknowledged) > to_aware_datetime(note.created)


def test_modnotes_no_notify(db, push_collector):
    user, token = generate_user()
    super_user, super_token = generate_user(is_superuser=True)

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert not res.jailed
        assert not res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 0

    with real_account_session(token) as account:
        res = account.ListModNotes(empty_pb2.Empty())
        assert len(res.mod_notes) == 0

    with real_admin_session(super_token) as admin:
        with mock_notification_email() as mock:
            admin.SendModNote(
                admin_pb2.SendModNoteReq(
                    user=user.username,
                    content="# Important note\nThis is a sample mod note.",
                    internal_id="sample_note",
                    do_not_notify=True,
                )
            )
        mock.assert_not_called()

    with real_jail_session(token) as jail:
        res = jail.JailInfo(empty_pb2.Empty())
        assert res.jailed
        assert res.has_pending_mod_notes
        assert len(res.pending_mod_notes) == 1
        note = res.pending_mod_notes[0]
        assert note.note_content == "# Important note\nThis is a sample mod note."
