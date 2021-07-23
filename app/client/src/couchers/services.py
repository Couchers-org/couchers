from couchers.proto import (
    account_pb2_grpc,
    admin_pb2_grpc,
    api_pb2_grpc,
    auth_pb2_grpc,
    blocking_pb2_grpc,
    bugs_pb2_grpc,
    communities_pb2_grpc,
    conversations_pb2_grpc,
    discussions_pb2_grpc,
    donations_pb2_grpc,
    events_pb2_grpc,
    groups_pb2_grpc,
    jail_pb2_grpc,
    media_pb2_grpc,
    pages_pb2_grpc,
    references_pb2_grpc,
    requests_pb2_grpc,
    resources_pb2_grpc,
    search_pb2_grpc,
    threads_pb2_grpc,
)

# servicers not usable through client:
# * gis
# * stripe


def get_all_stubs(channel):
    return {
        "account": account_pb2_grpc.AccountStub(channel),
        "admin": admin_pb2_grpc.AdminStub(channel),
        "api": api_pb2_grpc.APIStub(channel),
        "auth": auth_pb2_grpc.AuthStub(channel),
        "blocking": blocking_pb2_grpc.BlockingStub(channel),
        "bugs": bugs_pb2_grpc.BugsStub(channel),
        "communities": communities_pb2_grpc.CommunitiesStub(channel),
        "conversations": conversations_pb2_grpc.ConversationsStub(channel),
        "discussions": discussions_pb2_grpc.DiscussionsStub(channel),
        "donations": donations_pb2_grpc.DonationsStub(channel),
        "events": events_pb2_grpc.EventsStub(channel),
        "groups": groups_pb2_grpc.GroupsStub(channel),
        "jail": jail_pb2_grpc.JailStub(channel),
        "media": media_pb2_grpc.MediaStub(channel),
        "pages": pages_pb2_grpc.PagesStub(channel),
        "references": references_pb2_grpc.ReferencesStub(channel),
        "requests": requests_pb2_grpc.RequestsStub(channel),
        "resources": resources_pb2_grpc.ResourcesStub(channel),
        "search": search_pb2_grpc.SearchStub(channel),
        "threads": threads_pb2_grpc.ThreadsStub(channel),
    }
