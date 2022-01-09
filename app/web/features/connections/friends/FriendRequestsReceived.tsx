import { Box, CircularProgress, IconButton } from "@material-ui/core";
import { CheckIcon, CloseIcon } from "components/Icons";
import { FriendRequest } from "proto/api_pb";
import { useIsMounted, useSafeState } from "utils/hooks";

import { FRIEND_REQUESTS, NO_FRIEND_REQUESTS } from "../constants";
import type { SetMutationError } from ".";
import FriendSummaryView from "./FriendSummaryView";
import FriendTile from "./FriendTile";
import useFriendRequests from "./useFriendRequests";
import useRespondToFriendRequest from "./useRespondToFriendRequest";

interface RespondToFriendRequestActionProps {
  friendRequest: FriendRequest.AsObject;
  setMutationError: SetMutationError;
}

function RespondToFriendRequestAction({
  friendRequest,
  setMutationError,
}: RespondToFriendRequestActionProps) {
  const { isLoading, isSuccess, reset, respondToFriendRequest } =
    useRespondToFriendRequest();

  return friendRequest.state === FriendRequest.FriendRequestStatus.PENDING ? (
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
                friendRequest,
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
                friendRequest,
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
  const { data, isLoading, isError, errors } = useFriendRequests("received");

  return (
    <FriendTile
      title={FRIEND_REQUESTS}
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!data?.length}
      noDataMessage={NO_FRIEND_REQUESTS}
    >
      {data &&
        data.map((friendRequest) => (
          <FriendSummaryView
            key={friendRequest.friendRequestId}
            friend={friendRequest.friend}
          >
            <RespondToFriendRequestAction
              friendRequest={friendRequest}
              setMutationError={setMutationError}
            />
          </FriendSummaryView>
        ))}
    </FriendTile>
  );
}

export default FriendRequestsReceived;
