import { Message } from "../pb/conversations_pb";
import {
  CreateHostRequestReq,
  GetHostRequestMessagesReq,
  GetHostRequestReq,
  ListHostRequestsReq,
  SendHostRequestMessageReq,
} from "../pb/requests_pb";
import client from "./client";

export async function listHostRequests(
  type: "all" | "hosting" | "surfing",
  onlyActive: boolean = false
) {
  const req = new ListHostRequestsReq();
  req.setOnlyActive(onlyActive);
  req.setOnlyReceived(type === "hosting");
  req.setOnlySent(type === "surfing");

  const response = await client.requests.listHostRequests(req);
  const hostRequests = response.getHostRequestsList();

  return hostRequests.map((hostRequest) => hostRequest.toObject());
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

export async function getHostRequestMessages(
  id: number
): Promise<Message.AsObject[]> {
  const req = new GetHostRequestMessagesReq();
  req.setHostRequestId(id);

  const response = await client.requests.getHostRequestMessages(req);
  const messages = response.getMessagesList();

  return messages.map((message) => message.toObject());
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
