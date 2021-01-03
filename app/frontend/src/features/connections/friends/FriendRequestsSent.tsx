import { Box, IconButton } from "@material-ui/core";
import React from "react";
import { CloseIcon } from "../../../components/Icons";
import { FriendRequest } from "../../../pb/api_pb";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useCancelFriendRequest from "../useCancelFriendRequest";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import type { SetMutationError } from ".";
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
        data.map(({ friendRequestId, friend, state }) => (
          <FriendSummaryView key={friendRequestId} friend={friend}>
            <CancelFriendRequestAction
              friendRequestId={friendRequestId}
              state={state}
              setMutationError={setMutationError}
            />
          </FriendSummaryView>
        ))}
    </FriendTile>
  );
}

export default FriendRequestsSent;
