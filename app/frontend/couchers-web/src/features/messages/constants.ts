import { HostRequestStatus } from "couchers-core/src/proto/conversations_pb";

export const hostRequestStatusLabels = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]: "Accepted",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]: "Cancelled",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]: "Confirmed",
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]: "Pending",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]: "Rejected",
};

export const COULDNT_FIND_ANY_FRIENDS = "Couldn't find any friends";
export const CREATE = "Create";
export const DATE_FROM = "Date from";
export const DATE_TO = "Date to";
export const ERROR_USER_LOAD = "(User load error)";
export const FRIENDS = "Friends";
export const LOAD_MORE = "Load more";
export const MARK_LAST_SEEN_TIMEOUT = 500;
export const MESSAGES = "Messages";
export const NEW_CHAT = "Create a new chat";
export const NEW_GROUP_CHAT = "Create group chat";
export const NO_GROUP_CHAT = "No group chats yet";
export const NO_MESSAGES = "No messages";
export const REQUEST_CLOSED_MESSAGE =
  "This host request is closed or in the past. To continue chatting, add the other person as a friend and send them a normal message.";
export const TITLE = "Title";
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
  `You can only message users you have added as your friends. ` +
  `Please make sure you are done chatting before you  ` +
  `reject their request.`;

export const CLOSE_REQUEST_DIALOG_SURFER =
  `You can only message users you have added as your friends. ` +
  `Please make sure you are done chatting before you  ` +
  `cancel your request.`;
