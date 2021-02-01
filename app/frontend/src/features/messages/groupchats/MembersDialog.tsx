import {
  CircularProgress,
  DialogProps,
  List,
  ListItem,
  makeStyles,
} from "@material-ui/core";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { Error as GrpcError } from "grpc-web";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

import Alert from "../../../components/Alert";
import Avatar from "../../../components/Avatar";
import Button from "../../../components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "../../../components/Dialog";
import IconButton from "../../../components/IconButton";
import { AddIcon, CloseIcon } from "../../../components/Icons";
import TextBody from "../../../components/TextBody";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { service } from "../../../service";
import useAuthStore from "../../auth/useAuthStore";
import useUsers from "../../userQueries/useUsers";

const useStyles = makeStyles((theme) => ({
  memberListItemContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    marginInlineEnd: theme.spacing(1),
  },
}));

function MemberListItem({
  groupChatId,
  member,
  memberIsAdmin,
  userIsAdmin,
  setError,
}: {
  groupChatId: number;
  member: User.AsObject;
  memberIsAdmin: boolean;
  userIsAdmin: boolean;
  setError: (value: string) => void;
}) {
  const classes = useStyles();

  const queryClient = useQueryClient();
  const clearError = () => setError("");
  const handleError = (error: GrpcError) => setError(error.message);
  const invalidate = () => {
    queryClient.invalidateQueries(["groupChatMessages", groupChatId]);
    queryClient.invalidateQueries(["groupChats"]);
    queryClient.invalidateQueries(["groupChat", groupChatId]);
  };

  const makeAdmin = useMutation<Empty, GrpcError, void>(
    () => service.conversations.makeGroupChatAdmin(groupChatId, member),
    {
      onMutate: clearError,
      onSuccess: invalidate,
      onError: handleError,
    }
  );
  const removeAdmin = useMutation<Empty, GrpcError, void>(
    () => service.conversations.removeGroupChatAdmin(groupChatId, member),
    {
      onMutate: clearError,
      onSuccess: invalidate,
      onError: handleError,
    }
  );

  const handleMakeAdmin = () => makeAdmin.mutate();
  const handleRemoveAdmin = () => removeAdmin.mutate();

  return (
    <ListItem dense className={classes.memberListItemContainer}>
      {userIsAdmin &&
        //TODO: Colours
        (memberIsAdmin ? (
          <IconButton
            size="small"
            loading={removeAdmin.isLoading}
            onClick={handleRemoveAdmin}
          >
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton
            size="small"
            loading={makeAdmin.isLoading}
            onClick={handleMakeAdmin}
          >
            <AddIcon />
          </IconButton>
        ))}
      <Avatar user={member} className={classes.avatar} />
      <TextBody noWrap>
        {member.name}
        {memberIsAdmin && " (admin)"}
      </TextBody>
    </ListItem>
  );
}

export default function MembersDialog({
  groupChat,
  ...props
}: DialogProps & { groupChat?: GroupChat.AsObject }) {
  const [error, setError] = useState("");

  const currentUserId = useAuthStore().authState.userId;
  const members = useUsers(groupChat?.memberUserIdsList ?? []);
  const currentUserIsAdmin = !!groupChat?.adminUserIdsList.includes(
    currentUserId ?? 0
  );

  return (
    <Dialog {...props} aria-labelledby="members-dialog-title">
      <DialogTitle id="members-dialog-title">Chat Members</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <List>
          {members.isLoading ? (
            <CircularProgress />
          ) : (
            Array.from(members.data?.values() ?? []).map((user) =>
              user ? (
                <MemberListItem
                  key={`members-dialog-${user.userId}`}
                  member={user}
                  memberIsAdmin={
                    groupChat?.adminUserIdsList.includes(user.userId) ?? false
                  }
                  userIsAdmin={currentUserIsAdmin}
                  groupChatId={groupChat?.groupChatId ?? 0}
                  setError={setError}
                />
              ) : null
            )
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() =>
            props.onClose ? props.onClose({}, "escapeKeyDown") : null
          }
        >
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
