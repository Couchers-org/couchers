import { Box, CircularProgress, IconButton } from "@material-ui/core";
import { CheckIcon, CloseIcon } from "components/Icons";
import type { SetMutationError } from "features/connections/friends";
import FriendSummaryView from "features/connections/friends/FriendSummaryView";
import FriendTile from "features/connections/friends/FriendTile";
import useFriendRequests from "features/connections/friends/useFriendRequests";
import useRespondToFriendRequest from "features/connections/friends/useRespondToFriendRequest";
import { FriendRequest } from "pb/api_pb";
import React from "react";
import { useIsMounted, useSafeState } from "utils/hooks";

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
  const {
    isLoading,
    isSuccess,
    reset,
    respondToFriendRequest,
  } = useRespondToFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      {isLoading || isSuccess ? (
        <CircularProgress />
      ) : (
        <>
          <IconButton
            aria-label="Accept request"
            onClick={() => {
              reset();
              respondToFriendRequest({
                accept: true,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            <CheckIcon />
          </IconButton>
          <IconButton
            aria-label="Decline request"
            onClick={() => {
              reset();
              respondToFriendRequest({
                accept: false,
                friendRequestId,
                setMutationError,
              });
            }}
          >
            <CloseIcon />
          </IconButton>
        </>
      )}
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
      hasData={!!data?.length}
      noDataMessage="No pending friend requests!"
    >
      {data &&
        data.map((friendRequest) => (
          <FriendSummaryView
            key={friendRequest.friendRequestId}
            friend={friendRequest.friend}
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
