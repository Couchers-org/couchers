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
import { Link } from "react-router-dom";
import Alert from "../../../components/Alert";
import { CheckIcon, CloseIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { FriendRequest, User } from "../../../pb/api_pb";
import { service } from "../../../service";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";

const useStyles = makeStyles((theme) => ({
  actionButton: {
    borderRadius: "100%",
    minWidth: "auto",
    height: theme.spacing(3),
    width: theme.spacing(3),
    padding: 0,
  },
  container: {
    "& > :last-child": {
      marginBottom: theme.spacing(1),
    },
  },
  friendItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: `0 ${theme.spacing(1)}`,
  },
  friendLink: {
    color: theme.palette.text.primary,
    textDecoration: "none",
  },
  noPendingRequestText: {
    marginLeft: theme.spacing(1),
  },
  userLoadErrorAlert: {
    borderRadius: 0,
  },
}));

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

export type SetMutationError = React.Dispatch<React.SetStateAction<string>>;

interface FriendRequestItemProps {
  friendRequest: FriendRequest.AsObject & {
    friend?: User.AsObject;
  };
  setMutationError: SetMutationError;
}

function FriendRequestItem({
  friendRequest: { friend, friendRequestId, state, userId },
  setMutationError,
}: FriendRequestItemProps) {
  const classes = useStyles();
  const respondToFriendRequest = useRespondToFriendRequest();

  return friend ? (
    <Box className={classes.friendItem} key={friend.userId}>
      <Link className={classes.friendLink} to={`/user/${friend.username}`}>
        <Typography variant="h2" component="h3">
          {friend.name}
        </Typography>
        <TextBody>@{friend.username}</TextBody>
      </Link>
      {state === FriendRequest.FriendRequestStatus.PENDING && (
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
      )}
    </Box>
  ) : (
    <Alert className={classes.userLoadErrorAlert} severity="error">
      Error loading user {userId}
    </Alert>
  );
}

function FriendRequestsReceived() {
  const baseClasses = useFriendsBaseStyles();
  const classes = useStyles();
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const { data, isLoading, isError, errors } = useFriendRequests("Received");

  return (
    <Card>
      <Box className={classes.container}>
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
            <FriendRequestItem
              key={friendRequest.friendRequestId}
              friendRequest={friendRequest}
              setMutationError={setMutationError}
            />
          ))
        ) : (
          <TextBody className={classes.noPendingRequestText}>
            No pending friend requests!
          </TextBody>
        )}
      </Box>
    </Card>
  );
}

export default FriendRequestsReceived;
