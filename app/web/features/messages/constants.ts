import { HostRequestStatus, MessageThreadFilter } from "proto/conversations_pb";

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
// "archived" is orthogonal: it's the full list restricted to archived threads.
export function messageFilterToRequest(filter: MessageFilterType): {
  filter: MessageThreadFilter;
  onlyArchived: boolean;
} {
  switch (filter) {
    case "unread":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_UNREAD,
        onlyArchived: false,
      };
    case "chats":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_CHATS,
        onlyArchived: false,
      };
    case "hosting":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_HOSTING,
        onlyArchived: false,
      };
    case "surfing":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_SURFING,
        onlyArchived: false,
      };
    case "public-trips":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_PUBLIC_TRIPS,
        onlyArchived: false,
      };
    case "archived":
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_ALL,
        onlyArchived: true,
      };
    default:
      return {
        filter: MessageThreadFilter.MESSAGE_THREAD_FILTER_ALL,
        onlyArchived: false,
      };
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
