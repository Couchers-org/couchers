import { CircularProgress, DialogProps, List, ListItem } from "@mui/material";
import Avatar from "components/Avatar";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "components/Dialog";
import TextBody from "components/TextBody";
import { useLiteUsers } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { GLOBAL, MESSAGES } from "i18n/namespaces";
import { LiteUser } from "proto/api_pb";
import { GroupChat } from "proto/conversations_pb";
import React from "react";
import makeStyles from "utils/makeStyles";

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
  member: LiteUser.AsObject;
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
  const { t } = useTranslation([GLOBAL, MESSAGES]);
  const members = useLiteUsers(groupChat?.memberUserIdsList ?? []);

  return (
    <Dialog {...props} aria-labelledby="members-dialog-title">
      <DialogTitle id="members-dialog-title">
        {t("messages:members_dialog.title")}
      </DialogTitle>
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
          {t("global:ok")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
