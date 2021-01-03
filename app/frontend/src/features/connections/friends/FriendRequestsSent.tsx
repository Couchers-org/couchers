import {
  Box,
  Card,
  CircularProgress,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error } from "grpc-web";
import React from "react";
import { useMutation, useQueryClient } from "react-query";
import Alert from "../../../components/Alert";
import { CloseIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { FriendRequest } from "../../../pb/api_pb";
import FriendSummaryView from "./FriendSummaryView";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import { service } from "../../../service";
import type { SetMutationError } from ".";

interface CancelFriendRequestVariables {
  friendRequestId: number;
  setMutationError: SetMutationError;
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  const { mutate: cancelFriendRequest } = useMutation<
    Empty,
    Error,
    CancelFriendRequestVariables
  >(({ friendRequestId }) => service.api.cancelFriendRequest(friendRequestId), {
    onMutate: async ({ setMutationError }) => {
      setMutationError("");
      await queryClient.cancelQueries("friendRequestsSent");
    },
    onSuccess: () => {
      queryClient.invalidateQueries("friendRequestsSent");
    },
    onError: (error, { setMutationError }) => {
      setMutationError(error.message);
    },
  });

  return cancelFriendRequest;
}
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
  const baseClasses = useFriendsBaseStyles();
  const {
    data: friendRequestsSentData,
    isLoading,
    isError,
    errors,
  } = useFriendRequests("Sent");

  return (
    <Card>
      <Box className={baseClasses.container}>
        <Typography className={baseClasses.header} variant="h2">
          Friend requests you sent
        </Typography>
        {isError || mutationError ? (
          <Alert className={baseClasses.errorAlert} severity="error">
            {isError ? errors.join("\n") : mutationError}
          </Alert>
        ) : null}
        {isLoading ? (
          <CircularProgress className={baseClasses.circularProgress} />
        ) : friendRequestsSentData && friendRequestsSentData.length ? (
          friendRequestsSentData.map((friendRequest) => (
            <FriendSummaryView
              key={friendRequest.friendRequestId}
              friendRequest={friendRequest}
            >
              <CancelFriendRequestAction
                friendRequestId={friendRequest.friendRequestId}
                state={friendRequest.state}
                setMutationError={setMutationError}
              />
            </FriendSummaryView>
          ))
        ) : (
          <TextBody className={baseClasses.noFriendItemText}>
            No pending friend requests!
          </TextBody>
        )}
      </Box>
    </Card>
  );
}

export default FriendRequestsSent;
