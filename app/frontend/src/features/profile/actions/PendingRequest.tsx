/* has to check whether request is sent or received
if sent, return a simple disabled "pending request" button
if recieved, return the response button*/
import { SetMutationError } from "features/connections/friends";
import useRequestFromUser from "features/profile/hooks/useRequestFromUser";
import useRequestSentToUser from "features/profile/hooks/useRequestSentToUser";
import React from "react";

import PendingFriendRequestSent from "./PendingFriendRequestSent";
import RespondToFriendRequestProfileButton from "./RespondFriendRequestButton";

interface PendingRequestProps {
  userId: number;
  setMutationError: SetMutationError;
}

function PendingRequest({ userId, setMutationError }: PendingRequestProps) {
  const sentRequest = useRequestSentToUser({userId})
  const receivedRequest = useRequestFromUser({userId})
  if (sentRequest === false) {
    if (receivedRequest !== false) {
      return (
        <RespondToFriendRequestProfileButton
          friendRequestId={receivedRequest.friendRequestId}
          state={receivedRequest.state}
          setMutationError={setMutationError}
        />
      );
    }
  } else {
    return <PendingFriendRequestSent />;
  }
  return null;
}

export default PendingRequest;
