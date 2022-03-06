import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import { CONNECTIONS } from "i18n/namespaces";
import { Trans, useTranslation } from "next-i18next";
import useFriendList from "./useFriendList";

function FriendList() {
  const { errors, isLoading, isError, data: friends } = useFriendList();
  const { t } = useTranslation([CONNECTIONS]);

  return (
    <FriendTile
      title={ t("connections_friend_list_title") }
      errorMessage={isError ? errors.join("\n") : null}
      isLoading={isLoading}
      hasData={!!friends?.length}
      noDataMessage={ t("connections_no_friends") }
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
