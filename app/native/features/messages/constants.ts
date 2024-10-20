import { HostRequestStatus } from "@/proto/conversations_pb";

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

export const MARK_LAST_SEEN_TIMEOUT = 500;
