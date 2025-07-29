from datetime import timedelta
from itertools import zip_longest

from couchers.utils import now, to_aware_datetime
from proto import api_pb2, search_pb2


def reranker(users: [search_pb2.SearchUser]) -> [search_pb2.SearchUser]:
    """
    Given a list of users that are about to be returned in a search, reranks (re-orders) them better.
    """

    # this is our reranker v0: it just reorders users to be in a striped newbie/intermediate/experienced_host fashion
    boost_newbies, experienced_host, others = [], [], []
    for user in users:
        if user.num_references > 3:
            experienced_host.append(user)
        elif (
            user.num_references == 0
            and user.has_completed_my_home
            and user.hosting_status == api_pb2.HOSTING_STATUS_CAN_HOST
            and now() - to_aware_datetime(user.joined) < timedelta(days=180)
        ):
            boost_newbies.append(user)
        else:
            others.append(user)

    # now we're going to rerank boost_newbies by joined date
    boost_newbies.sort(key=lambda user: to_aware_datetime(user.joined), reverse=True)

    reconstructed_users = []
    for users_from_groups in zip_longest(boost_newbies, experienced_host, others):
        for user in users_from_groups:
            if user is not None:
                reconstructed_users.append(user)

    assert len(reconstructed_users) == len(users)

    return reconstructed_users
