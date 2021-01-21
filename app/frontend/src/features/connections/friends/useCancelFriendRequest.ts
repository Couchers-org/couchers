import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { useQueryClient, useMutation } from "react-query";
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
      onMutate: async ({ setMutationError }) => {
        setMutationError("");
      },
      onSuccess: (_, { userId }) => {
        queryClient.invalidateQueries("friendRequestsSent");
        queryClient.invalidateQueries(["user", userId]);
      },
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
    }
  );

  return { cancelFriendRequest, isLoading, isSuccess, reset };
}
