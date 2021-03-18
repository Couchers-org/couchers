import { HostRequestStatus } from "pb/conversations_pb";
import { HostRequest } from "pb/requests_pb";
import { numNights } from "utils/date";

export const hostRequestStatusLabels = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]: "Accepted",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]: "Cancelled",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]: "Confirmed",
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]: "Pending",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]: "Rejected",
};

export const CREATE = "Create";
export const ERROR_USER_LOAD = "(User load error)";
export const FRIENDS = "Friends";
export const LOAD_MORE = "Load more";
export const MARK_LAST_SEEN_TIMEOUT = 500;
export const NEW_CHAT = "Create a new chat";
export const NEW_GROUP_CHAT = "Create group chat";
export const NO_GROUP_CHAT = "No group chats yet";
export const NO_MESSAGES = "No messages";
export const TITLE = "Title";

export interface HostRequestListItemProps {
  hostRequest: HostRequest.AsObject;
}

export const nightsRequested = ({
  toDate,
  fromDate,
}: HostRequest.AsObject) => `Requesting to stay for
${numNights(toDate, fromDate)}`;
