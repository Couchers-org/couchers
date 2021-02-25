import { HostRequestStatus } from "pb/conversations_pb";
import {
  CreateHostRequestReq,
  GetHostRequestMessagesReq,
  GetHostRequestReq,
  ListHostRequestsReq,
  MarkLastSeenHostRequestReq,
  RespondHostRequestReq,
  SendHostRequestMessageReq,
} from "pb/requests_pb";
import client from "service/client";

export async function listHostRequests({
  lastRequestId = 0,
  count = 10,
  type = "all",
  onlyActive = false,
}: {
  lastRequestId?: number;
  count?: number;
  type?: "all" | "hosting" | "surfing";
  onlyActive?: boolean;
}) {
  const req = new ListHostRequestsReq();
  req.setOnlyActive(onlyActive);
  req.setOnlyReceived(type === "hosting");
  req.setOnlySent(type === "surfing");
  req.setLastRequestId(lastRequestId);
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
  text: string
) {
  const req = new RespondHostRequestReq();
  req.setHostRequestId(id);
  req.setStatus(status);
  req.setText(text);
  await client.requests.respondHostRequest(req);
}

export async function getHostRequestMessages(
  id: number,
  lastMessageId: number = 0,
  count: number = 20
) {
  const req = new GetHostRequestMessagesReq();
  req.setHostRequestId(id);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.requests.getHostRequestMessages(req);

  return response.toObject();
}

export async function createHostRequest(
  data: Required<CreateHostRequestReq.AsObject>
) {
  const req = new CreateHostRequestReq();
  req.setToUserId(data.toUserId);
  req.setFromDate(data.fromDate);
  req.setToDate(data.toDate);
  req.setText(data.text);

  const response = await client.requests.createHostRequest(req);

  return response.getHostRequestId();
}

export function markLastRequestSeen(hostRequestId: number, messageId: number) {
  const req = new MarkLastSeenHostRequestReq();
  req.setHostRequestId(hostRequestId);
  req.setLastSeenMessageId(messageId);

  return client.requests.markLastSeenHostRequest(req);
}
