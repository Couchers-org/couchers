import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";

import { friendRequestKey, userKey } from "@/features/queryKeys";
import { FriendRequest, User } from "@/proto/api_pb";
import { service } from "@/service";

import { SetMutationError } from ".";

interface RespondToFriendRequestVariables {
  accept: boolean;
  friendRequest: FriendRequest.AsObject;
  setMutationError: SetMutationError;
}

const useRespondToFriendRequest = () => {
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
        if (accept) {
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
    onSuccess: async (_, { friendRequest }) => {
      await queryClient.invalidateQueries({
        queryKey: ["friendIds"],
      });
      await queryClient.invalidateQueries({
        queryKey: friendRequestKey("received"),
      });
      await queryClient.invalidateQueries({
        queryKey: userKey(friendRequest.userId),
      });
      await queryClient.invalidateQueries({
        queryKey: ["ping"],
      });
    },
  });

  return { isPending, isSuccess, reset, respondToFriendRequest };
};

export default useRespondToFriendRequest;
