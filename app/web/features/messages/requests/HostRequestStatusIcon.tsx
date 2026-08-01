import { Avatar, AvatarProps } from "@mui/material";
import { CheckIcon, CrossIcon, QuestionIcon } from "components/Icons";
import { HostRequestStatus } from "couchers/proto/messages_pb";
import { HostRequest } from "couchers/proto/requests_pb";
import React from "react";
import { theme } from "theme";

interface HostRequestStatusIconProps extends AvatarProps {
  hostRequest: HostRequest.AsObject;
}

export default function HostRequestStatusIcon({
  hostRequest,
  ...props
}: HostRequestStatusIconProps) {
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
      sizes=" "
      sx={{ fontSize: theme.typography.pxToRem(16), height: 18, width: 18 }}
    >
      {icon}
    </Avatar>
  );
}
