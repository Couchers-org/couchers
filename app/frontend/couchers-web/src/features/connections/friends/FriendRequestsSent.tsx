import { Box, CircularProgress, IconButton } from "@material-ui/core";
import { CloseIcon } from "components/Icons";
import { FriendRequest } from "couchers-core/src/proto/api_pb";
import type { SetMutationError } from "features/connections/friends";
import FriendSummaryView from "features/connections/friends/FriendSummaryView";
import FriendTile from "features/connections/friends/FriendTile";
import useCancelFriendRequest from "features/connections/friends/useCancelFriendRequest";
import useFriendRequests from "features/connections/friends/useFriendRequests";
import React from "react";
import { useIsMounted, useSafeState } from "utils/hooks";

import { FRIEND_REQUESTS_SENT, NO_FRIEND_REQUESTS_SENT } from "../constants";

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
  const { cancelFriendRequest, isLoading, isSuccess, reset } =
    useCancelFriendRequest();

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
  const { data, isLoading, isError, errors } = useFriendRequests("sent");

  return (
    <FriendTile
      title={FRIEND_REQUESTS_SENT}
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!data?.length}
      noDataMessage={NO_FRIEND_REQUESTS_SENT}
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
