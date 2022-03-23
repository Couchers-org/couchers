import { Box, CircularProgress, IconButton } from "@material-ui/core";
import { CloseIcon } from "components/Icons";
import { useTranslation } from "i18n";
import { CONNECTIONS } from "i18n/namespaces";
import { FriendRequest } from "proto/api_pb";
import React from "react";
import { useIsMounted, useSafeState } from "utils/hooks";

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
  const { t } = useTranslation(CONNECTIONS);
  const { cancelFriendRequest, isLoading, isSuccess, reset } =
    useCancelFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      {isLoading || isSuccess ? (
        <CircularProgress />
      ) : (
        <IconButton
          aria-label={t("cancel_request_button_a11y_label")}
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
  const { t } = useTranslation(CONNECTIONS);
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("sent");

  return (
    <FriendTile
      title={t("friend_requests_sent_title")}
      errorMessage={
        isError ? errors.join("\n") : mutationError ? mutationError : null
      }
      isLoading={isLoading}
      hasData={!!data?.length}
      noDataMessage={t("sent_friend_requests_empty_state")}
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
