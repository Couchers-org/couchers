import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { useMutation, useQueryClient } from "react-query";

import { service } from "../../../service";
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
    isLoading,
    isSuccess,
    reset,
  } = useMutation<Empty, Error, CancelFriendRequestVariables>(
    ({ friendRequestId }) => service.api.cancelFriendRequest(friendRequestId),
    {
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
      onMutate: async ({ setMutationError }) => {
        setMutationError("");
      },
      onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries("friendRequestsSent");
        queryClient.invalidateQueries(["user", userId]);
      },
    }
  );

  return { cancelFriendRequest, isLoading, isSuccess, reset };
}
