import { SetMutationError } from "features/connections/friends";
import AddFriendButton from "features/connections/friends/AddFriendButton";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import PendingFriendReqButton from "features/profile/actions/PendingFriendReqButton";
import { User } from "proto/api_pb";
import React from "react";

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
  } else if (user.friends === User.FriendshipStatus.FRIENDS) {
    return (
      <MessageUserButton user={user} setMutationError={setMutationError} />
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
