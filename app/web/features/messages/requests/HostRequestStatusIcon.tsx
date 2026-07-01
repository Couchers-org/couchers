import { Avatar, AvatarProps } from "@mui/material";
import { CheckIcon, CrossIcon, QuestionIcon } from "components/Icons";
import { HostRequestStatus } from "proto/conversations_pb";
import React from "react";
import { theme } from "theme";

interface HostRequestStatusIconProps extends AvatarProps {
  status: HostRequestStatus;
  // For public-trip offers, an accepted offer is a positive terminal state for
  // the traveller, so it's shown green rather than the neutral gray of a normal
  // accepted request that's still awaiting confirmation.
  isOffer?: boolean;
}

export default function HostRequestStatusIcon({
  status: s,
  isOffer = false,
  ...props
}: HostRequestStatusIconProps) {
  let icon = null;
  let color = null;

  if (s === HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED) {
    icon = <CheckIcon fontSize="inherit" />;
    color = isOffer ? "green" : "gray";
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
