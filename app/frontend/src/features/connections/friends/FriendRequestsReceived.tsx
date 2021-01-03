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
import { CheckIcon, CloseIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { FriendRequest } from "../../../pb/api_pb";
import { service } from "../../../service";
import FriendSummaryView from "./FriendSummaryView";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import type { SetMutationError } from ".";

interface RespondToFriendRequestVariables {
  accept: boolean;
  friendRequestId: number;
  setMutationError: SetMutationError;
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const { mutate: respondToFriendRequest } = useMutation<
    Empty,
    Error,
    RespondToFriendRequestVariables
  >(
    ({ friendRequestId, accept }) =>
      service.api.respondFriendRequest(friendRequestId, accept),
    {
      onMutate: async ({ setMutationError }) => {
        setMutationError("");
        await queryClient.cancelQueries("friendRequestsReceived");
      },
      onSuccess: () => {
        queryClient.invalidateQueries("friendIds");
        queryClient.invalidateQueries("friendRequestsReceived");
      },
      onError: (error, { setMutationError }) => {
        setMutationError(error.message);
      },
    }
  );

  return respondToFriendRequest;
}

interface RespondToFriendRequestActionProps {
  friendRequestId: number;
  state: FriendRequest.FriendRequestStatus;
  setMutationError: SetMutationError;
}

function RespondToFriendRequestAction({
  friendRequestId,
  state,
  setMutationError,
}: RespondToFriendRequestActionProps) {
  const respondToFriendRequest = useRespondToFriendRequest();

  return state === FriendRequest.FriendRequestStatus.PENDING ? (
    <Box>
      <IconButton
        aria-label="Accept request"
        onClick={() =>
          respondToFriendRequest({
            accept: true,
            friendRequestId,
            setMutationError,
          })
        }
      >
        <CheckIcon />
      </IconButton>
      <IconButton
        aria-label="Decline request"
        onClick={() =>
          respondToFriendRequest({
            accept: false,
            friendRequestId,
            setMutationError,
          })
        }
      >
        <CloseIcon />
      </IconButton>
    </Box>
  ) : null;
}

function FriendRequestsReceived() {
  const baseClasses = useFriendsBaseStyles();
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("Received");

  return (
    <Card>
      <Box className={baseClasses.container}>
        <Typography className={baseClasses.header} variant="h2">
          Friend requests
        </Typography>
        {isError || mutationError ? (
          <Alert className={baseClasses.errorAlert} severity="error">
            {isError ? errors.join("\n") : mutationError}
          </Alert>
        ) : null}
        {isLoading ? (
          <CircularProgress className={baseClasses.circularProgress} />
        ) : data && data.length ? (
          data.map((friendRequest) => (
            <FriendSummaryView
              key={friendRequest.friendRequestId}
              friendRequest={friendRequest}
            >
              <RespondToFriendRequestAction
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

export default FriendRequestsReceived;
