import CircularProgress from "components/CircularProgress";
import { SetMutationError } from "features/connections/friends";
import useRequestFromUser from "features/profile/hooks/useRequestFromUser";
import React from "react";

import PendingFriendRequestSent from "./PendingFriendRequestSent";
import RespondToFriendRequestProfileButton from "./RespondFriendRequestButton";

interface PendingRequestProps {
  userId: number;
  setMutationError: SetMutationError;
}

function PendingRequest({ userId, setMutationError }: PendingRequestProps) {
  const receivedRequest = useRequestFromUser({ userId });
  return receivedRequest ? (
    receivedRequest.isLoading ? (
      <CircularProgress />
    ) : (
      <RespondToFriendRequestProfileButton
        friendRequestId={receivedRequest.friendRequestFromUser.friendRequestId}
        state={receivedRequest.friendRequestFromUser.state}
        setMutationError={setMutationError}
      />
    )
  ) : (
    <PendingFriendRequestSent />
  );
}

export default PendingRequest;
