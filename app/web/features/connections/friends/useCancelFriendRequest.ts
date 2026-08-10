import { useMutation, useQueryClient } from "@tanstack/react-query";
import { friendRequestKey, userKey } from "features/queryKeys";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { service } from "service";

import { SetMutationError } from ".";

interface CancelFriendRequestVariables {
  friendRequestId: number;
  userId: number;
  setMutationError: SetMutationError;
}

export default function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const {
    mutate: cancelFriendRequest,
    isPending,
    isSuccess,
    reset,
  } = useMutation<Empty, RpcError, CancelFriendRequestVariables>({
    mutationFn: ({ friendRequestId }) => service.api.cancelFriendRequest(friendRequestId),

    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
    onMutate: async ({ setMutationError }) => {
      setMutationError("");
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: friendRequestKey("sent"),
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: userKey(userId),
        exact: true,
      });
    },
  });

  return { cancelFriendRequest, isPending, isSuccess, reset };
}
