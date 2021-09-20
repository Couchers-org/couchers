import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { FriendRequest, User } from "proto/api_pb";
import { friendRequestKey, userKey } from "queryKeys";
import { useMutation, useQueryClient } from "react-query";
import { service } from "service";

import { SetMutationError } from ".";

interface RespondToFriendRequestVariables {
  accept: boolean;
  friendRequest: FriendRequest.AsObject;
  setMutationError: SetMutationError;
}

export default function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const {
    mutate: respondToFriendRequest,
    isLoading,
    isSuccess,
    reset,
  } = useMutation<Empty, Error, RespondToFriendRequestVariables>(
    ({ friendRequest, accept }) =>
      service.api.respondFriendRequest(friendRequest.friendRequestId, accept),
    {
      onMutate: async ({ setMutationError, friendRequest, accept }) => {
        setMutationError("");
        await queryClient.cancelQueries(friendRequestKey("received"));

        const cachedUser = queryClient.getQueryData<User.AsObject>([
          "user",
          friendRequest.userId,
        ]);

        if (cachedUser) {
          if (accept === true) {
            queryClient.setQueryData<User.AsObject>(
              userKey(friendRequest.userId),
              {
                ...cachedUser,
                friends: User.FriendshipStatus.FRIENDS,
              }
            );
          } else {
            queryClient.setQueryData<User.AsObject>(
              userKey(friendRequest.userId),
              {
                ...cachedUser,
                friends: User.FriendshipStatus.NOT_FRIENDS,
              }
            );
          }
        }
        return cachedUser;
      },
      onError: (error, { setMutationError, friendRequest }, cachedUser) => {
        setMutationError(error.message);
        if (cachedUser) {
          queryClient.setQueryData(userKey(friendRequest.userId), cachedUser);
        }
      },
      onSuccess: (_, { friendRequest }) => {
        queryClient.invalidateQueries("friendIds");
        queryClient.invalidateQueries(friendRequestKey("received"));
        queryClient.invalidateQueries(userKey(friendRequest.userId));
        queryClient.invalidateQueries("ping");
      },
    }
  );

  return { isLoading, isSuccess, reset, respondToFriendRequest };
}
