import { FRIEND_LIST_TITLE, NO_FRIENDS } from "../constants";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendList from "./useFriendList";

function FriendList() {
  const { errors, isLoading, isError, data: friends } = useFriendList();

  return (
    <FriendTile
      title={FRIEND_LIST_TITLE}
      errorMessage={isError ? errors.join("\n") : null}
      isLoading={isLoading}
      hasData={!!friends?.length}
      noDataMessage={NO_FRIENDS}
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
