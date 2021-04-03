import useFriendRequests from "features/connections/friends/useFriendRequests";
import React from "react";

interface RequestSentToUserProps {
  userId: number;
}

export default function useRequestFromUser({ userId }: RequestSentToUserProps) {
  const { data: friendRequestReceived, isLoading } = useFriendRequests("received");
  const friendRequestFromUser = friendRequestReceived?.find(
    (e) => e.userId === userId
  );
  return friendRequestFromUser ? { friendRequestFromUser, isLoading} : false;
}
