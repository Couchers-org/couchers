import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";

import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendList from "./useFriendList";

function FriendList() {
  const { t } = useTranslation(CONNECTIONS);
  const { errors, isLoading, isError, data: friends } = useFriendList();

  return (
    <FriendTile
      title={t("friend_list_title")}
      errorMessage={isError ? errors.join("\n") : null}
      isLoading={isLoading}
      hasData={!!friends?.length}
      noDataMessage={t("friends_empty_state")}
    >
      {friends &&
        friends.map((friend) =>
          friend ? (
            <FriendSummaryView key={friend.userId} friend={friend} />
          ) : null
        )}
    </FriendTile>
  );
}

export default FriendList;
