import { Stack } from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import { CONNECTIONS } from "i18n/namespaces";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { FriendRequest } from "proto/api_pb";
import { useEffect, useRef } from "react";
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
        aria-label={t("connections:friend_requests_dismiss_button")}
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
        {t("connections:friend_requests_dismiss_button")}
      </Button>
      <Button
        aria-label={t("connections:accept")}
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
  const router = useRouter();

  const friendIdParam = router.query["friend-id"];
  const friendId = friendIdParam ? Number(friendIdParam) : null;
  const requestNotFound =
    friendId !== null &&
    !isLoading &&
    data !== undefined &&
    !data.some((req) => req.userId === friendId);

  const highlightedCardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlightedCardRef.current) {
      highlightedCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [friendId, data]);

  return (
    <>
      {requestNotFound && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("connections:friend_request_no_longer_available")}
        </Alert>
      )}
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
              cardRef={
                friendRequest.userId === friendId
                  ? highlightedCardRef
                  : undefined
              }
            >
              <RespondToFriendRequestAction
                friendRequest={friendRequest}
                setMutationError={setMutationError}
              />
            </FriendSummaryView>
          ))}
      </FriendTile>
    </>
  );
}

export default FriendRequestsReceived;
