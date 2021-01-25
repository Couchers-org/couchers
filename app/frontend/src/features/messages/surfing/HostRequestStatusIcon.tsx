import { Avatar, AvatarProps, makeStyles } from "@material-ui/core";
import classNames from "classnames";
import React from "react";

import { CheckIcon, CrossIcon, QuestionIcon } from "../../../components/Icons";
import { HostRequestStatus } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";

const useStyles = makeStyles((theme) => ({
  avatar: {
    width: 18,
    height: 18,
    fontSize: 16,
  },
}));

interface HostRequestStatusIconProps extends AvatarProps {
  hostRequest: HostRequest.AsObject;
}

export default function HostRequestStatusIcon({
  hostRequest,
  ...props
}: HostRequestStatusIconProps) {
  const classes = useStyles();
  const s = hostRequest.status;
  let icon = null;
  let color = null;
  if (s === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
    icon = <CheckIcon fontSize="inherit" />;
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) {
    icon = <CrossIcon fontSize="inherit" />;
    color = "red";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    icon = <QuestionIcon fontSize="inherit" />;
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED) {
    icon = <CrossIcon fontSize="inherit" />;
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
    icon = <CheckIcon fontSize="inherit" />;
    color = "green";
  } else throw new Error(`Unhandled host request case: ${s}`);

  return (
    <Avatar
      {...props}
      style={{ backgroundColor: color }}
      className={classNames(classes.avatar, props.className)}
      sizes=" "
    >
      {icon}
    </Avatar>
  );
}
