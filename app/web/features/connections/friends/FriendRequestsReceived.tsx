import { Box, CircularProgress, IconButton } from "@material-ui/core";
import { CheckIcon, CloseIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { FriendRequest } from "proto/api_pb";
import { useIsMounted, useSafeState } from "utils/hooks";

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
  const { t } = useTranslation(CONNECTIONS);
  const { isLoading, isSuccess, reset, respondToFriendRequest } =
    useRespondToFriendRequest();

  return friendRequest.state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      {isLoading || isSuccess ? (
        <CircularProgress />
      ) : (
        <>
          <IconButton
            aria-label={t("accept_button_a11y_label")}
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
            aria-label={t("decline_button_a11y_label")}
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
  const { t } = useTranslation(CONNECTIONS);
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("received");

  return (
    <FriendTile
      title={t("friend_requests_title")}
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!data?.length}
      noDataMessage={t("friend_requests_empty_state")}
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
