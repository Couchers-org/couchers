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
import { CloseIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { FriendRequest, User } from "../../../pb/api_pb";
import useFriendsBaseStyles from "./useFriendsBaseStyles";
import useFriendRequests from "./useFriendRequests";
import { useIsMounted, useSafeState } from "../../../utils/hooks";
import { service } from "../../../service";

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

function useCancelFriendRequest(
  friendRequestId: number,
  setMutationError: SetMutationError
) {
  const queryClient = useQueryClient();
  const { mutate: cancelFriendRequest } = useMutation<Empty, Error>(
    () => service.api.cancelFriendRequest(friendRequestId),
    {
      onMutate: async () => {
        setMutationError("");
        await queryClient.cancelQueries("friendRequestsSent");
      },
      onSuccess: () => {
        queryClient.invalidateQueries("friendRequestsSent");
      },
      onError: (error) => {
        setMutationError(error.message);
      },
    }
  );

  return cancelFriendRequest;
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

  const cancelFriendRequest = useCancelFriendRequest(
    friendRequestId,
    setMutationError
  );

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
            aria-label="Cancel request"
            onClick={() => cancelFriendRequest()}
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

function FriendRequestsSent() {
  const isMounted = useIsMounted();
  const [mutationError, setMutationError] = useSafeState(isMounted, "");
  const baseClasses = useFriendsBaseStyles();
  const classes = useStyles();
  const {
    data: friendRequestsSentData,
    isLoading,
    isError,
    errors,
  } = useFriendRequests("Sent");

  return (
    <Card>
      <Box className={classes.container}>
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

export default FriendRequestsSent;
