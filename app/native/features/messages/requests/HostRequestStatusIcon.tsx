import { HostRequestStatus } from "proto/conversations_pb";
import { HostRequest } from "proto/requests_pb";
import React from "react";
import { Avatar } from 'react-native-paper';

interface HostRequestStatusIconProps {
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
    icon = 'check';
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_REJECTED) {
    icon = 'close';
    color = "red";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    icon = 'dots-horizontal';
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED) {
    icon = 'close';
    color = "gray";
  } else if (s === HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED) {
    icon = 'check';
    color = "green";
  } else throw new Error(`Unhandled host request case: ${s}`);

  return (
    <Avatar.Icon
      {...props}
      style={{ backgroundColor: color }}
      icon={icon}
      size={18}
      color="white"
    />
  );
}
