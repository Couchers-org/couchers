import { HostRequestStatus } from "proto/conversations_pb";

export const hostRequestStatusLabels = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]: "Accepted",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]: "Cancelled",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]: "Confirmed",
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]: "Pending",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]: "Rejected",
};

export const DATE_FROM = "Date from";
export const DATE_TO = "Date to";

export const MARK_ALL_READ = "Mark all as read";
export const MARK_LAST_SEEN_TIMEOUT = 500;
export const MESSAGES = "Messages";
export const NO_MESSAGES = "No messages";
export const REQUEST_CLOSED_MESSAGE =
  "This host request is closed or in the past. To continue chatting, send the other person a normal message.";
export const WRITE_REFERENCE = "Write a Reference";

export const hostingStatusText = (
  isHost: boolean,
  status: HostRequestStatus
) => {
  if (status === HostRequestStatus.HOST_REQUEST_STATUS_PENDING) {
    return `This request is still pending`;
  } else
    return isHost
      ? `You have ${hostRequestStatusLabels[status].toLowerCase()} this request`
      : `Your request was ${hostRequestStatusLabels[status].toLowerCase()}`;
};

export const CLOSE_REQUEST_DIALOG_TITLE = "Are you done messaging?";

export const CLOSE_REQUEST_DIALOG_HOST =
  `Please make sure you are done chatting before you  ` +
  `reject their request.`;

export const CLOSE_REQUEST_DIALOG_SURFER =
  `Please make sure you are done chatting before you  ` +
  `cancel your request.`;
