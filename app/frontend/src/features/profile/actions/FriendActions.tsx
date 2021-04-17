import { CircularProgress } from "@material-ui/core";
import { SetMutationError } from "features/connections/friends";
import AddFriendButton from "features/connections/friends/AddFriendButton";
import useFriendList from "features/connections/friends/useFriendList";
import useFriendRequests from "features/connections/friends/useFriendRequests";
import MessageUserButton from "features/profile/actions/MessageUserButton";
import PendingFriendReqButton from "features/profile/actions/PendingFriendReqButton";
import { User } from "pb/api_pb";
import React from "react";

interface FriendActionsProps {
  user: User.AsObject;
  setMutationError: SetMutationError;
}

export default function FriendActions({
  user,
  setMutationError,
}: FriendActionsProps) {
  const { isLoading: isFriendRequestsLoading } = useFriendRequests("received");
  const { isLoading: isFriendsLoading } = useFriendList();

  let component;
  user.friends === User.FriendshipStatus.NOT_FRIENDS
    ? (component = (
        <AddFriendButton
          userId={user.userId}
          setMutationError={setMutationError}
        />
      ))
    : user.friends === User.FriendshipStatus.FRIENDS
    ? (component = (
        <MessageUserButton user={user} setMutationError={setMutationError} />
      ))
    : user.pendingFriendRequest &&
      user.pendingFriendRequest.sent === false &&
      (component = (
        <PendingFriendReqButton
          friendRequest={user.pendingFriendRequest}
          setMutationError={setMutationError}
        />
      ));

  const isLoading = isFriendRequestsLoading || isFriendsLoading;

  return isLoading ? <CircularProgress /> : <>{component}</>;
}
