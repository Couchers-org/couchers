import { Avatar, AvatarProps } from "@mui/material";
import { CheckIcon, CrossIcon, QuestionIcon } from "components/Icons";
import dayjs from "dayjs";
import { HostRequestStatus } from "proto/conversations_pb";
import { HostRequest } from "proto/requests_pb";
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

  const isRequestPast = dayjs(hostRequest.toDate).isBefore(dayjs().format("L"));

  if (s === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
    icon = <CheckIcon fontSize="inherit" />;
    color = isRequestPast ? "grey.500" : "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) {
    icon = <CrossIcon fontSize="inherit" />;
    color = isRequestPast ? "grey.500" : "red";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    icon = <QuestionIcon fontSize="inherit" />;
    color = isRequestPast ? "grey.500" : "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED) {
    icon = <CrossIcon fontSize="inherit" />;
    color = isRequestPast ? "grey.500" : "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
    icon = <CheckIcon fontSize="inherit" />;
    color = isRequestPast ? "grey.500" : "green";
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
