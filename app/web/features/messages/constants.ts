import { MessageThreadCategory } from "proto/conversations_pb";
import { HostRequestStatus } from "proto/messages_pb";

export type MessageFilterType =
  | "all"
  | "unread"
  | "chats"
  | "hosting"
  | "surfing"
  | "public-trips"
  | "archived";

export const MESSAGE_FILTER_TYPES: MessageFilterType[] = [
  "all",
  "unread",
  "chats",
  "hosting",
  "surfing",
  "public-trips",
  "archived",
];

// Maps a URL filter slug to the unified ListMessageThreads request params.
// categories, onlyUnread and onlyArchived are orthogonal; an empty categories
// list means all categories.
export function messageFilterToRequest(filter: MessageFilterType): {
  categories: MessageThreadCategory[];
  onlyUnread: boolean;
  onlyArchived: boolean;
} {
  switch (filter) {
    case "unread":
      return { categories: [], onlyUnread: true, onlyArchived: false };
    case "chats":
      return {
        categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_CHATS],
        onlyUnread: false,
        onlyArchived: false,
      };
    case "hosting":
      return {
        categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_HOSTING],
        onlyUnread: false,
        onlyArchived: false,
      };
    case "surfing":
      return {
        categories: [MessageThreadCategory.MESSAGE_THREAD_CATEGORY_SURFING],
        onlyUnread: false,
        onlyArchived: false,
      };
    case "public-trips":
      return {
        categories: [
          MessageThreadCategory.MESSAGE_THREAD_CATEGORY_MY_PUBLIC_TRIPS,
        ],
        onlyUnread: false,
        onlyArchived: false,
      };
    case "archived":
      return { categories: [], onlyUnread: false, onlyArchived: true };
    default:
      return { categories: [], onlyUnread: false, onlyArchived: false };
  }
}

export const requestStatusToTransKey = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]:
    "host_request_status.accepted",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]:
    "host_request_status.cancelled",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]:
    "host_request_status.confirmed",
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]:
    "host_request_status.pending",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]:
    "host_request_status.rejected",
} as const;

export const requestStatusChangedMessageToTransKey = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]:
    "control_message.host_request_status_changed.accepted",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]:
    "control_message.host_request_status_changed.cancelled",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]:
    "control_message.host_request_status_changed.confirmed",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]:
    "control_message.host_request_status_changed.rejected",
  // There's no flow in which a request status transitions back to pending.
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]: null,
} as const;

export const requestStatusChangedMessageToSelfTransKey = {
  [HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED]:
    "control_message.host_request_status_changed.accepted_self",
  [HostRequestStatus.HOST_REQUEST_STATUS_CANCELLED]:
    "control_message.host_request_status_changed.cancelled_self",
  [HostRequestStatus.HOST_REQUEST_STATUS_CONFIRMED]:
    "control_message.host_request_status_changed.confirmed_self",
  [HostRequestStatus.HOST_REQUEST_STATUS_REJECTED]:
    "control_message.host_request_status_changed.rejected_self",
  [HostRequestStatus.HOST_REQUEST_STATUS_PENDING]: null,
} as const;

export const MARK_LAST_SEEN_TIMEOUT = 500;
