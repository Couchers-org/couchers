/* has to check whether request is sent or received
if sent, return a simple disabled "pending request" button
if recieved, return the response button*/
import React, { useRef, useState } from "react";
import useFriendRequests from "features/connections/friends/useFriendRequests";
import { PersonAddIcon } from "components/Icons";
import Button from "components/Button";
import Menu, { MenuItem } from "components/Menu";
import { SetMutationError } from ".";
import { PENDING } from "features/connections/constants";
import useRespondToFriendRequest from "./useRespondToFriendRequest";
import RespondToFriendRequestProfileButton from "./RespondToFriendRequestProfileButton";
import PendingFriendRequestSent from "./PendingFriendRequestSent";

interface PendingRequestProps {
  userId: number;
  setMutationError: SetMutationError;
}

function CheckSentRequests(userId: number) {
  //const { data } = useFriendRequests("sent");
  const friendRequestsSent = useFriendRequests("sent").data;
  const friendRequestToUser = friendRequestsSent?.find(
    (e) => e.userId === userId
  );
  if (friendRequestToUser !== undefined) {
    const request = friendRequestToUser;
    return request;
  } else {
    return false;
  }
}

function CheckReceivedRequests(userId: number) {
  const { data } = useFriendRequests("received");
  const friendRequestsReceived = data;
  const friendRequestFromUser = friendRequestsReceived?.find(
    (e) => e.userId === userId
  );
  if (friendRequestFromUser !== undefined) {
    const request = friendRequestFromUser;
    return request;
  } else {
    return false;
  }
}

function PendingRequest({ userId, setMutationError }: PendingRequestProps) {
  if (CheckSentRequests(userId) === false) {
    const request = CheckReceivedRequests(userId);
    if (request !== false) {
      //const safeRequestId = requestId;
      return (
        <RespondToFriendRequestProfileButton
          friendRequestId={request.friendRequestId}
          state={request.state}
          setMutationError={setMutationError}
        />
      );
    }
  } else if (CheckSentRequests(userId) !== false) {
    return <PendingFriendRequestSent />;
  }
  return null;
}

export default PendingRequest;
