import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendRequest, User } from "couchers/proto/api_pb";
import { friendRequestKey, pingQueryKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
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
    isPending,
    isSuccess,
    reset,
  } = useMutation<Empty, Error, RespondToFriendRequestVariables>({
    mutationFn: ({ friendRequest, accept }) =>
      service.api.respondFriendRequest(friendRequest.friendRequestId, accept),

    onMutate: async ({ setMutationError, friendRequest, accept }) => {
      setMutationError("");
      await queryClient.cancelQueries({
        queryKey: friendRequestKey("received"),
      });

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
            },
          );
        } else {
          queryClient.setQueryData<User.AsObject>(
            userKey(friendRequest.userId),
            {
              ...cachedUser,
              friends: User.FriendshipStatus.NOT_FRIENDS,
            },
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
      queryClient.invalidateQueries({
        queryKey: ["friendIds"],
      });
      queryClient.invalidateQueries({
        queryKey: friendRequestKey("received"),
      });
      queryClient.invalidateQueries({
        queryKey: userKey(friendRequest.userId),
      });
      queryClient.invalidateQueries({
        queryKey: [pingQueryKey],
      });
    },
  });

  return { isPending, isSuccess, reset, respondToFriendRequest };
}
