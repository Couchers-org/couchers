import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";

import FriendTile from "./FriendTile";
import { blockedUserIdsKey } from "features/queryKeys";
import { useQuery } from "react-query";
import { getBlockedUsers } from "service/blocking";
import { GetBlockedUsersRes } from "proto/blocking_pb";

function BlockedUsersList() {
  const {
    data: blockedUsernames,
    error: blockedUserListError,
    isLoading,
  } = useQuery<GetBlockedUsersRes.AsObject["blockedUsernamesList"], Error>(
    blockedUserIdsKey,
    async () => {
      return await getBlockedUsers();
    },
  );
  const { t } = useTranslation([CONNECTIONS]);

console.log("Blocked Usernames:", blockedUsernames);
  return (
    <>
      {/* {error && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
          {error.message}
        </Alert>
      )} */}
      <FriendTile
        title={t("connections:blocked_list_title")}
        errorMessage={blockedUserListError?.message || null}
        isLoading={isLoading}
        hasData={!!blockedUsernames?.length}
        noDataMessage={t("connections:no_blocked_users")}
      >
        {blockedUsernames && blockedUsernames.map((username) => username)}
      </FriendTile>
    </>
  );
}

export default BlockedUsersList;
