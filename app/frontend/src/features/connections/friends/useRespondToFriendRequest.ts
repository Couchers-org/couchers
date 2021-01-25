import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import { useQueryClient, useMutation } from "react-query";
import { SetMutationError } from ".";
import { service } from "../../../service";

interface RespondToFriendRequestVariables {
  accept: boolean;
  friendRequestId: number;
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
    ({ friendRequestId, accept }) =>
      service.api.respondFriendRequest(friendRequestId, accept),
    {
      onMutate: async ({ setMutationError }) => {
        setMutationError("");
        await queryClient.cancelQueries("friendRequestsReceived");
      },
      onSuccess: () => {
        queryClient.invalidateQueries("friendIds");
        queryClient.invalidateQueries("friendRequestsReceived");
        queryClient.invalidateQueries("ping");
      },
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
    }
  );

  return { isLoading, isSuccess, reset, respondToFriendRequest };
}
