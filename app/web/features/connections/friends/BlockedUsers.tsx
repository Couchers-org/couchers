import { blockedUsersKey } from "features/queryKeys";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { BlockedUser, GetBlockedUsersRes } from "proto/blocking_pb";
import { useQuery } from "react-query";
import { service } from "service";

import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";

function BlockedUsersList() {
  const { t } = useTranslation([CONNECTIONS]);

  const { data, error, isLoading } = useQuery<
    GetBlockedUsersRes.AsObject,
    RpcError
  >(blockedUsersKey, service.blocking.getBlockedUsers);

  return (
    <>
      <FriendTile
        title={t("connections:blocked_list_title")}
        errorMessage={error?.message || null}
        isLoading={isLoading}
        hasData={!!data?.blockedUsersList.length}
        noDataMessage={t("connections:no_blocked_users")}
      >
        {data?.blockedUsersList.map((user: BlockedUser.AsObject) => (
          <FriendSummaryView key={user.username} friend={user} />
        ))}
      </FriendTile>
    </>
  );
}

export default BlockedUsersList;
