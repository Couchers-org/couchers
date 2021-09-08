import {
  capitalize,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import Avatar from "components/Avatar";
import TextBody from "components/TextBody";
import useAuthStore from "features/auth/useAuthStore";
import HostRequestStatusIcon from "features/messages/requests/HostRequestStatusIcon";
import {
  controlMessageText,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import { useUser } from "features/userQueries/useUsers";
import { HostRequest } from "proto/requests_pb";
import { formatDate } from "utils/date";
import { firstName } from "utils/names";

import { hostingStatusText } from "../constants";

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
  const classes = useStyles();
  const currentUserId = useAuthStore().authState.userId;
  const isHost = currentUserId === hostRequest.hostUserId;
  const { data: otherUser, isLoading: isOtherUserLoading } = useUser(
    isHost ? hostRequest.surferUserId : hostRequest.hostUserId
  );
  const isUnread =
    hostRequest.lastSeenMessageId !== hostRequest.latestMessage?.messageId;
  //define the latest message author's name and
  //control message target to use in short message preview
  const authorName =
    hostRequest?.latestMessage?.authorUserId === currentUserId
      ? "you"
      : firstName(otherUser?.name) || "";

  const targetName = hostRequest?.latestMessage
    ? messageTargetId(hostRequest?.latestMessage) === currentUserId
      ? "you"
      : firstName(otherUser?.name) || ""
    : "";

  //text is the control message text or message text, truncated
  const latestMessageText = hostRequest.latestMessage
    ? isControlMessage(hostRequest.latestMessage)
      ? controlMessageText(hostRequest.latestMessage, authorName, targetName)
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
              <Typography variant="body2">
                {isOtherUserLoading ? (
                  <Skeleton width={200} />
                ) : (
                  hostingStatusText(isHost, hostRequest.status)
                )}
              </Typography>
            </div>
            <Typography component="div" display="inline" variant="h3">
              {`${formatDate(hostRequest.fromDate, true)} - ${formatDate(
                hostRequest.toDate,
                true
              )}`}
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
