import useFriendRequests from "features/connections/friends/useFriendRequests";
import React from "react";

interface RequestSentToUserProps {
  userId: number;
}

export default function useRequestSentToUser({
  userId,
}: RequestSentToUserProps) {
  const { data: friendRequestsSent } = useFriendRequests("sent");
  const friendRequestToUser = friendRequestsSent?.find(
    (e) => e.userId === userId
  );
  return friendRequestToUser ? friendRequestToUser : false;
}
