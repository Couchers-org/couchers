import { Box, CircularProgress, IconButton } from "@material-ui/core";
import React from "react";

import { CloseIcon } from "../../../components/Icons";
import { FriendRequest } from "../../../pb/api_pb";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import type { SetMutationError } from ".";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useCancelFriendRequest from "./useCancelFriendRequest";
import useFriendRequests from "./useFriendRequests";

interface CancelFriendRequestActionProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
  userId: number;
}

function CancelFriendRequestAction({
  friendRequestId,
  state,
  setMutationError,
  userId,
}: CancelFriendRequestActionProps) {
  const {
    cancelFriendRequest,
    isLoading,
    isSuccess,
    reset,
  } = useCancelFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      {isLoading || isSuccess ? (
        <CircularProgress />
      ) : (
        <IconButton
          aria-label="Cancel request"
          onClick={() => {
            reset();
            cancelFriendRequest({ friendRequestId, setMutationError, userId });
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
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
      hasData={!!data?.length}
      noDataMessage="No pending friend requests!"
    >
      {data &&
        data.map(({ friendRequestId, friend, userId, state }) => (
          <FriendSummaryView key={friendRequestId} friend={friend}>
            <CancelFriendRequestAction
              friendRequestId={friendRequestId}
              state={state}
              setMutationError={setMutationError}
              userId={userId}
            />
          </FriendSummaryView>
        ))}
    </FriendTile>
  );
}

export default FriendRequestsSent;
