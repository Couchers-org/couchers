import { Box, IconButton } from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { CheckIcon, CloseIcon } from "../../../components/Icons";
import { FriendRequest } from "../../../pb/api_pb";
import { service } from "../../../service";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import type { SetMutationError } from ".";

interface RespondToFriendRequestVariables {
  accept: boolean;
  friendRequestId: number;
  setMutationError: SetMutationError;
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const { mutate: respondToFriendRequest } = useMutation<
    Empty,
    Error,
    RespondToFriendRequestVariables
  >(
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
      },
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
    }
  );

  return respondToFriendRequest;
}

interface RespondToFriendRequestActionProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

function RespondToFriendRequestAction({
  friendRequestId,
  state,
  setMutationError,
}: RespondToFriendRequestActionProps) {
  const respondToFriendRequest = useRespondToFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      <IconButton
        aria-label="Accept request"
        onClick={() =>
          respondToFriendRequest({
            accept: true,
            friendRequestId,
            setMutationError,
          })
        }
      >
        <CheckIcon />
      </IconButton>
      <IconButton
        aria-label="Decline request"
        onClick={() =>
          respondToFriendRequest({
            accept: false,
            friendRequestId,
            setMutationError,
          })
        }
      >
        <CloseIcon />
      </IconButton>
    </Box>
  ) : null;
}

function FriendRequestsReceived() {
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("Received");

  return (
    <FriendTile
      title="Friend requests"
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
            <RespondToFriendRequestAction
              friendRequestId={friendRequest.friendRequestId}
              state={friendRequest.state}
              setMutationError={setMutationError}
            />
          </FriendSummaryView>
        ))}
    </FriendTile>
  );
}

export default FriendRequestsReceived;
