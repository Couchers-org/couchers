import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { useQueryClient, useMutation } from "react-query";
import { service } from "../../service";
import { SetMutationError } from "./friends";

interface CancelFriendRequestVariables {
  friendRequestId: number;
  setMutationError: SetMutationError;
}

export default function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { mutate: cancelFriendRequest, isLoading, isSuccess } = useMutation<
    Empty,
    Error,
    CancelFriendRequestVariables
  >(({ friendRequestId }) => service.api.cancelFriendRequest(friendRequestId), {
    onMutate: async ({ setMutationError }) => {
      setMutationError("");
      await queryClient.cancelQueries("friendRequestsSent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries("friendRequestsSent");
    },
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
  });

  return { cancelFriendRequest, isLoading, isSuccess };
}
