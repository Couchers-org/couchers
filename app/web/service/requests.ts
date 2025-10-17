import { HostRequestStatus } from "@couchers/services/conversations";
import {
  CreateHostRequestReq,
  GetHostRequestMessagesReq,
  GetHostRequestReq,
  GetResponseRateReq,
  ListHostRequestsReq,
  MarkLastSeenHostRequestReq,
  RespondHostRequestReq,
  SendHostRequestMessageReq,
} from "@couchers/services/requests";
import { Dayjs } from "dayjs";

import client from "./client";

export const listHostRequests = async ({
  lastRequestId = 0,
  count = 10,
  type = "all",
  onlyActive = false,
}: {
  lastRequestId?: number;
  count?: number;
  type?: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
}) => {
  const req = new ListHostRequestsReq();
  req.setOnlyActive(onlyActive);
  req.setOnlyReceived(type === "hosting");
  req.setOnlySent(type === "surfing");
  req.setLastRequestId(lastRequestId);
  req.setNumber(count);

  const response = await client.requests.listHostRequests(req);

  return response.toObject();
};

export const getHostRequest = async (id: number) => {
  const req = new GetHostRequestReq();
  req.setHostRequestId(id);
  const response = await client.requests.getHostRequest(req);
  return response.toObject();
};

export const sendHostRequestMessage = async (id: number, text: string) => {
  const req = new SendHostRequestMessageReq();
  req.setHostRequestId(id);
  req.setText(text);

  const response = await client.requests.sendHostRequestMessage(req);
  const messageId = response.getJsPbMessageId();

  return messageId;
};

export const respondHostRequest = async (
  id: number,
  status: HostRequestStatus,
  text: string,
) => {
  const req = new RespondHostRequestReq();
  req.setHostRequestId(id);
  req.setStatus(status);
  req.setText(text);
  await client.requests.respondHostRequest(req);
};

export const getHostRequestMessages = async (
  id: number,
  lastMessageId = 0,
  count = 20,
) => {
  const req = new GetHostRequestMessagesReq();
  req.setHostRequestId(id);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.requests.getHostRequestMessages(req);

  return response.toObject();
};

export type CreateHostRequestWrapper = Omit<
  Required<CreateHostRequestReq.AsObject>,
  "toDate" | "fromDate"
> & { toDate: Dayjs; fromDate: Dayjs; stayType: number };

export const createHostRequest = async (data: CreateHostRequestWrapper) => {
  const req = new CreateHostRequestReq();
  req.setHostUserId(data.hostUserId);
  req.setFromDate(data.fromDate.format().split("T")[0]);
  req.setToDate(data.toDate.format().split("T")[0]);
  req.setText(data.text);

  const response = await client.requests.createHostRequest(req);

  return response.getHostRequestId();
};

export const markLastRequestSeen = (
  hostRequestId: number,
  messageId: number,
) => {
  const req = new MarkLastSeenHostRequestReq();
  req.setHostRequestId(hostRequestId);
  req.setLastSeenMessageId(messageId);

  return client.requests.markLastSeenHostRequest(req);
};

export const getResponseRate = async (userId: number) => {
  const req = new GetResponseRateReq();
  req.setUserId(userId);
  return (await client.requests.getResponseRate(req)).toObject();
};
