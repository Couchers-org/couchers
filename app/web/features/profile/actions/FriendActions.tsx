import { User } from "@couchers/services/api";

import { SetMutationError } from "@/features/connections/friends";
import AddFriendButton from "@/features/connections/friends/AddFriendButton";

import PendingFriendReqButton from "./PendingFriendReqButton";

interface FriendActionsProps {
  user: User.AsObject;
  setMutationError: SetMutationError;
}

const FriendActions = ({ user, setMutationError }: FriendActionsProps) => {
  if (user.friends === User.FriendshipStatus.NOT_FRIENDS) {
    return (
      <AddFriendButton
        userId={user.userId}
        setMutationError={setMutationError}
      />
    );
  } else if (user.pendingFriendRequest && !user.pendingFriendRequest.sent) {
    return (
      <PendingFriendReqButton
        friendRequest={user.pendingFriendRequest}
        setMutationError={setMutationError}
      />
    );
  } else {
    return null;
  }
};

export default FriendActions;
