import { Box, IconButton } from "@mui/material";
import { useTranslation } from "next-i18next";

import CenteredSpinner from "@/components/CenteredSpinner/CenteredSpinner";
import { CheckIcon, CloseIcon } from "@/components/Icons";
import { CONNECTIONS } from "@/i18n/namespaces";
import { FriendRequest } from "@/proto/api_pb";
import { useIsMounted, useSafeState } from "@/utils/hooks";

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
  const { isPending, isSuccess, reset, respondToFriendRequest } =
    useRespondToFriendRequest();

  return friendRequest.state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      {isPending || isSuccess ? (
        <CenteredSpinner />
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
            size="large"
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
            size="large"
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
  const { t } = useTranslation([CONNECTIONS]);

  return (
    <FriendTile
      title={t("connections:friend_requests")}
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!data?.length}
      noDataMessage={t("connections:no_friend_requests")}
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
