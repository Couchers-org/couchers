from itertools import zip_longest

from proto import search_pb2


def reranker(users: [search_pb2.SearchUser]) -> [search_pb2.SearchUser]:
    """
    Given a list of users that are about to be returned in a search, reranks (re-orders) them better.
    """

    # this is our reranker v0: it just reorders users to be in a striped newbie/intermediate/experienced_host fashion
    newbies, intermediates, experienced_host = [], [], []
    for user in users:
        if user.num_references == 0:
            newbies.append(user)
        elif user.num_references <= 3:
            intermediates.append(user)
        else:
            experienced_host.append(user)

    reconstructed_users = []
    for users_from_groups in zip_longest(newbies, intermediates, experienced_host):
        for user in users_from_groups:
            if user is not None:
                reconstructed_users.append(user)

    assert len(reconstructed_users) == len(users)

    return reconstructed_users
