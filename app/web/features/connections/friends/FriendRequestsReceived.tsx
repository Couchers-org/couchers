import { Stack } from "@mui/material";
import { CONNECTIONS } from "i18n/namespaces";
import { useTranslation } from "next-i18next";
import { FriendRequest } from "proto/api_pb";
import { useIsMounted, useSafeState } from "utils/hooks";

import Button from "../../../components/Button";
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
  const { t } = useTranslation([CONNECTIONS]);
  const { isPending, isSuccess, reset, respondToFriendRequest } =
    useRespondToFriendRequest();

  if (friendRequest.state !== FriendRequest.FriendRequestStatus.PENDING) {
    return null;
  }

  const isLoading = isPending || isSuccess;

  return (
    <Stack direction="row" spacing={1}>
      <Button
        onClick={() => {
          reset();
          respondToFriendRequest({
            accept: false,
            friendRequest,
            setMutationError,
          });
        }}
        variant="outlined"
        loading={isLoading}
      >
        {t("connections:decline")}
      </Button>
      <Button
        onClick={() => {
          reset();
          respondToFriendRequest({
            accept: true,
            friendRequest,
            setMutationError,
          });
        }}
        loading={isLoading}
      >
        {t("connections:accept")}
      </Button>
    </Stack>
  );
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
