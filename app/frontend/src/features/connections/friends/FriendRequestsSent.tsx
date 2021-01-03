import { Box, IconButton } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { CloseIcon } from "../../../components/Icons";
import { FriendRequest } from "../../../pb/api_pb";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import { service } from "../../../service";
import type { SetMutationError } from ".";

interface CancelFriendRequestVariables {
  friendRequestId: number;
  setMutationError: SetMutationError;
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { mutate: cancelFriendRequest } = useMutation<
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

  return cancelFriendRequest;
}
interface CancelFriendRequestActionProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

function CancelFriendRequestAction({
  friendRequestId,
  state,
  setMutationError,
}: CancelFriendRequestActionProps) {
  const cancelFriendRequest = useCancelFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      <IconButton
        aria-label="Cancel request"
        onClick={() =>
          cancelFriendRequest({ friendRequestId, setMutationError })
        }
      >
        <CloseIcon />
      </IconButton>
    </Box>
  ) : null;
}

function FriendRequestsSent() {
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("Sent");

  return (
    <FriendTile
      title="Friend requests you sent"
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!(data && data.length)}
      noDataMessage="No pending friend requests!"
    >
      {data &&
        data.map((friendRequest) => (
          <FriendSummaryView
            key={friendRequest.friendRequestId}
            friendRequest={friendRequest}
          >
            <CancelFriendRequestAction
              friendRequestId={friendRequest.friendRequestId}
              state={friendRequest.state}
              setMutationError={setMutationError}
            />
          </FriendSummaryView>
        ))}
    </FriendTile>
  );
}

export default FriendRequestsSent;
