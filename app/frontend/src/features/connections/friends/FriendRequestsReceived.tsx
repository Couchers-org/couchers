import { Box, CircularProgress, IconButton } from "@material-ui/core";
import React from "react";
import { CheckIcon, CloseIcon } from "../../../components/Icons";
import { FriendRequest } from "../../../pb/api_pb";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendRequests from "./useFriendRequests";
import useRespondToFriendRequest from "./useRespondToFriendRequest";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import type { SetMutationError } from ".";

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
