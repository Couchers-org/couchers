import {
  Box,
  capitalize,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Skeleton } from "@material-ui/lab";
import classNames from "classnames";
import React from "react";

import Avatar from "../../../components/Avatar";
import TextBody from "../../../components/TextBody";
import { HostRequestStatus } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import { formatDate } from "../../../utils/date";
import { firstName } from "../../../utils/names";
import useAuthStore from "../../auth/useAuthStore";
import { useUser } from "../../userQueries/useUsers";
import { hostRequestStatusLabels } from "../constants";
import {
  controlMessageText,
  isControlMessage,
  messageTargetId,
} from "../utils";
import HostRequestStatusIcon from "./HostRequestStatusIcon";

const useStyles = makeStyles((theme) => ({
  root: {},
  hostStatusIcon: {
    marginInlineEnd: theme.spacing(1),
  },
  hostStatusContainer: {
    display: "flex",
    alignItems: "center",
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
  const { data: otherUser } = useUser(
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
    <ListItem className={classNames(classes.root, className)}>
      <ListItemAvatar>
        {!otherUser ? <Skeleton /> : <Avatar user={otherUser} />}
      </ListItemAvatar>
      <ListItemText
        disableTypography
        primary={
          <Typography variant="h2">
            {!otherUser ? <Skeleton /> : otherUser.name}
          </Typography>
        }
        secondary={
          <>
            <Box className={classes.hostStatusContainer}>
              <HostRequestStatusIcon
                hostRequest={hostRequest}
                className={classes.hostStatusIcon}
              />
              <Typography variant="body2">{statusText}</Typography>
            </Box>
            <TextBody noWrap>{latestMessageText}</TextBody>
          </>
        }
      />
    </ListItem>
  );
}
