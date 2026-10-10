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

function RespondToFriendRequestAction({ friendRequest, setMutationError }: RespondToFriendRequestActionProps) {
  const { t } = useTranslation([CONNECTIONS]);
  const { isPending, isSuccess, reset, respondToFriendRequest } = useRespondToFriendRequest();

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

interface FriendRequestsReceivedProps {
  /** Whether the sections above this one have loaded, so scrolling to it won't be undone by them growing */
  isContentAboveLoaded?: boolean;
}

function FriendRequestsReceived({ isContentAboveLoaded = true }: FriendRequestsReceivedProps) {
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("received");
  const { t } = useTranslation([CONNECTIONS]);
  const router = useRouter();

  // Counted from the list rather than the ping, so the badge always agrees with
  // the rows below it. Non-pending requests are in the list but not actionable.
  const pendingCount = data?.filter(({ state }) => state === FriendRequest.FriendRequestStatus.PENDING).length;

  const fromUserId = router.query.from ? Number(router.query.from) : null;
  const requestNotFound =
    fromUserId !== null && !isLoading && data !== undefined && !data.some((req) => req.userId === fromUserId);

  // Coming from a friend request notification (?from=), scroll to this section once per
  // notification, after everything above it has loaded so it doesn't get pushed back down.
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrolledForUserIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (fromUserId === null || isLoading || !isContentAboveLoaded) return;
    if (scrolledForUserIdRef.current === fromUserId) return;
    scrolledForUserIdRef.current = fromUserId;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [fromUserId, isLoading, isContentAboveLoaded]);

  return (
    <div ref={sectionRef}>
      {requestNotFound && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("connections:friend_request_no_longer_available")}
        </Alert>
      )}
      <FriendTile
        title={t("connections:friend_requests")}
        count={pendingCount}
        errorMessage={isError ? errors.join("\n") : mutationError ? mutationError : null}
        isLoading={isLoading}
        hasData={!!data?.length}
        noDataMessage={t("connections:no_friend_requests")}
      >
        {data &&
          data.map((friendRequest) => (
            <FriendSummaryView key={friendRequest.friendRequestId} friend={friendRequest.friend}>
              <RespondToFriendRequestAction friendRequest={friendRequest} setMutationError={setMutationError} />
            </FriendSummaryView>
          ))}
      </FriendTile>
    </div>
  );
}

export default FriendRequestsReceived;
