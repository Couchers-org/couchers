import { HostRequestStatus } from "proto/conversations_pb";
import {
  CreateHostRequestReq,
  GetHostRequestMessagesReq,
  GetHostRequestReq,
  GetResponseRateReq,
  HostRequestQuality,
  HostRequestSortBy,
  ListHostRequestsReq,
  MarkLastSeenHostRequestReq,
  RespondHostRequestReq,
  SendHostRequestFeedbackReq,
  SendHostRequestMessageReq,
  SetHostRequestArchiveStatusReq,
} from "proto/requests_pb";
import { Temporal } from "temporal-polyfill";

import client from "./client";

export async function listHostRequests({
  pageToken = "",
  count = 10,
  type = "all",
  onlyActive,
  onlyArchived,
  statusIn,
  sortBy,
}: {
  pageToken?: string;
  count?: number;
  type?: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
  onlyArchived?: boolean;
  statusIn?: HostRequestStatus[];
  sortBy?: HostRequestSortBy;
}) {
  const req = new ListHostRequestsReq();
  if (onlyActive !== undefined) {
    req.setOnlyActive(onlyActive);
  }
  if (onlyArchived !== undefined) {
    req.setOnlyArchived(onlyArchived);
  }
  if (statusIn !== undefined) {
    req.setStatusInList(statusIn);
  }
  if (sortBy !== undefined) {
    req.setSortBy(sortBy);
  }

  req.setOnlyReceived(type === "hosting");
  req.setOnlySent(type === "surfing");
  req.setPageToken(pageToken);
  req.setNumber(count);

  const response = await client.requests.listHostRequests(req);

  return response.toObject();
}

export async function getHostRequest(id: number) {
  const req = new GetHostRequestReq();
  req.setHostRequestId(id);
  const response = await client.requests.getHostRequest(req);
  return response.toObject();
}

export async function sendHostRequestMessage(id: number, text: string) {
  const req = new SendHostRequestMessageReq();
  req.setHostRequestId(id);
  req.setText(text);

  const response = await client.requests.sendHostRequestMessage(req);
  const messageId = response.getJsPbMessageId();

  return messageId;
}

export async function respondHostRequest(
  id: number,
  status: HostRequestStatus,
  text: string,
) {
  const req = new RespondHostRequestReq();
  req.setHostRequestId(id);
  req.setStatus(status);
  req.setText(text);
  await client.requests.respondHostRequest(req);
}

export async function getHostRequestMessages(
  id: number,
  lastMessageId = 0,
  count = 20,
) {
  const req = new GetHostRequestMessagesReq();
  req.setHostRequestId(id);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.requests.getHostRequestMessages(req);

  return response.toObject();
}

export type CreateHostRequestWrapper = Omit<
  Required<CreateHostRequestReq.AsObject>,
  "toDate" | "fromDate" | "publicTripId"
> & {
  toDate: Temporal.PlainDate;
  fromDate: Temporal.PlainDate;
  stayType: number;
  publicTripId?: number;
};

export async function createHostRequest(data: CreateHostRequestWrapper) {
  const req = new CreateHostRequestReq();
  req.setHostUserId(data.hostUserId);
  req.setFromDate(data.fromDate.toString());
  req.setToDate(data.toDate.toString());
  req.setText(data.text);
  // Set when this host request is an "offer to host" made in response to a
  // public trip, so the backend links the offer back to the trip.
  if (data.publicTripId) {
    req.setPublicTripId(data.publicTripId);
  }

  const response = await client.requests.createHostRequest(req);

  return response.getHostRequestId();
}

export function markLastRequestSeen(hostRequestId: number, messageId: number) {
  const req = new MarkLastSeenHostRequestReq();
  req.setHostRequestId(hostRequestId);
  req.setLastSeenMessageId(messageId);

  return client.requests.markLastSeenHostRequest(req);
}

export async function getResponseRate(userId: number) {
  const req = new GetResponseRateReq();
  req.setUserId(userId);
  return (await client.requests.getResponseRate(req)).toObject();
}

export async function sendHostRequestFeedback(
  hostRequestId: number,
  quality: HostRequestQuality,
  declineReason: string,
) {
  const req = new SendHostRequestFeedbackReq();
  req.setHostRequestId(hostRequestId);
  req.setHostRequestQuality(quality);
  req.setDeclineReason(declineReason);
  await client.requests.sendHostRequestFeedback(req);
}

export async function setHostRequestArchiveStatus(
  hostRequestId: number,
  isArchived: boolean,
) {
  const req = new SetHostRequestArchiveStatusReq();
  req.setHostRequestId(hostRequestId);
  req.setIsArchived(isArchived);
  return client.requests.setHostRequestArchiveStatus(req);
}
