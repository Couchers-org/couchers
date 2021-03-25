import {
  capitalize,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import Avatar from "components/Avatar";
import TextBody from "components/TextBody";
import useAuthStore from "features/auth/useAuthStore";
import { hostRequestStatusLabels } from "features/messages/constants";
import HostRequestStatusIcon from "features/messages/surfing/HostRequestStatusIcon";
import {
  controlMessageText,
  isControlMessage,
  messageTargetId,
} from "features/messages/utils";
import { useUser } from "features/userQueries/useUsers";
import { HostRequestStatus } from "pb/conversations_pb";
import { HostRequest } from "pb/requests_pb";
import React from "react";
import { formatDate } from "utils/date";
import { firstName } from "utils/names";

const useStyles = makeStyles((theme) => ({
  hostStatusContainer: {
    alignItems: "center",
    display: "flex",
  },
  hostStatusIcon: {
    marginInlineEnd: theme.spacing(1),
  },
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
  const isHost = currentUserId === hostRequest.toUserId;
  const { data: otherUser, isLoading: isOtherUserLoading } = useUser(
    isHost ? hostRequest.fromUserId : hostRequest.toUserId
  );

  const statusText = capitalize(
    `${
      hostRequest.status !== HostRequestStatus.HOST_REQUEST_STATUS_PENDING
        ? hostRequestStatusLabels[hostRequest.status] + " "
        : ""
    }${!isHost ? "your " : ""}request to stay ${formatDate(
      hostRequest.fromDate,
      true
    )} - ${formatDate(hostRequest.toDate, true)}`
  );

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
                {isOtherUserLoading ? <Skeleton width={200} /> : statusText}
              </Typography>
            </div>
            <TextBody noWrap>
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
