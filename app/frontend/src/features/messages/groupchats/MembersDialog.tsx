import {
  CircularProgress,
  DialogProps,
  List,
  ListItem,
  makeStyles,
} from "@material-ui/core";
import Avatar from "components/Avatar";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextBody from "components/TextBody";
import useUsers from "features/userQueries/useUsers";
import { User } from "pb/api_pb";
import { GroupChat } from "pb/conversations_pb";
import React from "react";

export const useMembersDialogStyles = makeStyles((theme) => ({
  avatar: {
    height: 30,
    marginInlineEnd: theme.spacing(1),
    width: 30,
  },
  memberListItemContainer: {
    alignItems: "center",
    display: "flex",
    justifyContent: "flex-start",
  },
}));

function MemberListItem({
  member,
  memberIsAdmin,
}: {
  member: User.AsObject;
  memberIsAdmin: boolean;
}) {
  const classes = useMembersDialogStyles();

  return (
    <ListItem dense className={classes.memberListItemContainer}>
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
  const members = useUsers(groupChat?.memberUserIdsList ?? []);

  return (
    <Dialog {...props} aria-labelledby="members-dialog-title">
      <DialogTitle id="members-dialog-title">Chat Members</DialogTitle>
      <DialogContent>
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
