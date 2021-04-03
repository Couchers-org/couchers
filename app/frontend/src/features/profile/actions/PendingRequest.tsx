/* has to check whether request is sent or received
if sent, return a simple disabled "pending request" button
if recieved, return the response button*/
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
  /*const sentRequest = useRequestSentToUser({ userId });*/
  const receivedRequest = useRequestFromUser({ userId });

  return receivedRequest ? <RespondToFriendRequestProfileButton
    friendRequestId={receivedRequest.friendRequestId}
    state={receivedRequest.state}
    setMutationError={setMutationError}
  /> : <PendingFriendRequestSent />;
}

export default PendingRequest;
