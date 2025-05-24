import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";

import FriendTile from "./FriendTile";
import { useBlockedUsers } from "./useBlockedUsers";
import FriendSummaryView from "./FriendSummaryView";
import { LiteUser } from "proto/api_pb";

function BlockedUsersList() {
  const { t } = useTranslation([CONNECTIONS]);

  const { blockedUsers, error, isError, isLoading } = useBlockedUsers();

  console.log("Blocked users:", blockedUsers);

  return (
    <>
      {/* {error && (
        <Alert severity="error" sx={{ marginBottom: theme.spacing(2) }}>
          {error.message}
        </Alert>
      )} */}
      {/* <FriendTile
        title={t("connections:blocked_list_title")}
        errorMessage={error || null}
        isLoading={isLoading}
        hasData={!!blockedUsers.length}
        noDataMessage={t("connections:no_blocked_users")}
      >

      </FriendTile> */}
    </>
  );
}

export default BlockedUsersList;
