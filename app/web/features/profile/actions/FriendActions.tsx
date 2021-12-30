import { SetMutationError } from "features/connections/friends";
import AddFriendButton from "features/connections/friends/AddFriendButton";
import { User } from "proto/api_pb";

import PendingFriendReqButton from "./PendingFriendReqButton";

interface FriendActionsProps {
  user: User.AsObject;
  setMutationError: SetMutationError;
}

export default function FriendActions({
  user,
  setMutationError,
}: FriendActionsProps) {
  if (user.friends === User.FriendshipStatus.NOT_FRIENDS) {
    return (
      <AddFriendButton
        userId={user.userId}
        setMutationError={setMutationError}
      />
    );
  } else if (
    user.pendingFriendRequest &&
    user.pendingFriendRequest.sent === false
  ) {
    return (
      <PendingFriendReqButton
        friendRequest={user.pendingFriendRequest}
        setMutationError={setMutationError}
      />
    );
  } else {
    return null;
  }
}
