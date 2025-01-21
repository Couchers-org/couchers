import { CONNECTIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";

import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendList from "./useFriendList";

function FriendList() {
  const { errors, isLoading, isError, data: friends } = useFriendList();
  const { t } = useTranslation([CONNECTIONS]);

  return (
    <FriendTile
      title={t("connections:friend_list_title")}
      errorMessage={isError ? errors.join("\n") : null}
      isLoading={isLoading}
      hasData={!!friends?.length}
      noDataMessage={t("connections:no_friends")}
    >
      {friends &&
        friends.map((friend) =>
          friend ? (
            <FriendSummaryView key={friend.userId} friend={friend} />
          ) : null,
        )}
    </FriendTile>
  );
}

export default FriendList;
