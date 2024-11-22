import {
  capitalize,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import classNames from "classnames";
import Avatar from "components/Avatar";
import TextBody from "components/TextBody";
import { useAuthContext } from "features/auth/AuthProvider";
import HostRequestStatusIcon from "features/messages/requests/HostRequestStatusIcon";
import {
  controlMessage,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import useCurrentUser from "features/userQueries/useCurrentUser";
import { useLiteUser } from "features/userQueries/useLiteUsers";
import { useTranslation } from "i18n";
import { MESSAGES } from "i18n/namespaces";
import { HostRequest } from "proto/requests_pb";
import dayjs from "utils/dayjs";
import { firstName } from "utils/names";

import HostRequestStatusText from "./HostRequestStatusText";

const useStyles = makeStyles((theme) => ({
  hostStatusContainer: {
    alignItems: "center",
    display: "flex",
  },
  hostStatusIcon: {
    marginInlineEnd: theme.spacing(1),
  },
  unread: { fontWeight: "bold" },
}));

export interface HostRequestListItemProps {
  hostRequest: HostRequest.AsObject;
  className?: string;
}

export default function HostRequestListItem({
  hostRequest,
  className,
}: HostRequestListItemProps) {
  const { t } = useTranslation(MESSAGES);
  const classes = useStyles();
  const { authState } = useAuthContext();
  const isHost = authState.userId === hostRequest.hostUserId;
  const { data: currentUser } = useCurrentUser();
  const { data: otherUser, isLoading: isOtherUserLoading } = useLiteUser(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId
  );
  const isUnread =
    hostRequest.lastSeenMessageId !== hostRequest.latestMessage?.messageId;
  //define the latest message author's name and
  //control message target to use in short message preview
  const authorName =
    hostRequest?.latestMessage?.authorUserId === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || "";

  const targetName = hostRequest?.latestMessage
    ? messageTargetId(hostRequest.latestMessage) === authState.userId
      ? firstName(currentUser?.name) || ""
      : firstName(otherUser?.name) || ""
    : "";

  //text is the control message text or message text, truncated
  const latestMessageText = hostRequest.latestMessage
    ? isControlMessage(hostRequest.latestMessage)
      ? controlMessage({
          message: hostRequest.latestMessage,
          user: authorName,
          target_user: targetName,
          t,
        })
      : //if it's a normal message, show "<User's Name>: <The message>"
        `${capitalize(authorName)}: ${
          hostRequest.latestMessage.text?.text || ""
        }`
    : "";

  return (
    <ListItem className={className}>
      <ListItemAvatar>
        <Avatar user={otherUser} isProfileLink={false} />
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={
          <Typography variant="h2">
            {!otherUser ? <Skeleton width={100} /> : otherUser.name}
          </Typography>
        }
        secondary={
          <>
            <div className={classes.hostStatusContainer}>
              <HostRequestStatusIcon
                hostRequest={hostRequest}
                className={classes.hostStatusIcon}
              />
              {isOtherUserLoading ? (
                <Skeleton width={200} />
              ) : (
                <HostRequestStatusText
                  isHost={isHost}
                  requestStatus={hostRequest.status}
                />
              )}
            </div>
            <Typography component="div" display="inline" variant="h3">
              {`${dayjs(hostRequest.fromDate).format("LL")} - ${dayjs(
                hostRequest.toDate
              ).format("LL")}`}
            </Typography>
            <TextBody
              noWrap
              className={classNames({ [classes.unread]: isUnread })}
            >
              {isOtherUserLoading ? (
                <Skeleton width={100} />
              ) : (
                latestMessageText
              )}
            </TextBody>
          </>
        }
      />
    </ListItem>
  );
}
