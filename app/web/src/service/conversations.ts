import {
  BoolValue,
  StringValue,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { StatusCode } from "grpc-web";
import { User } from "proto/api_pb";
import {
  CreateChatReq,
  EditChatReq,
  GetDirectMessageReq,
  GetChatMessagesReq,
  GetChatReq,
  InviteToChatReq,
  LeaveChatReq,
  ListChatsReq,
  MakeChatAdminReq,
  MarkLastSeenChatReq,
  RemoveChatAdminReq,
  SendMessageReq,
} from "proto/conversations_pb";
import client from "service/client";
import isGrpcError from "utils/isGrpcError";

export async function listChats(lastMessageId: number = 0, count: number = 10) {
  const req = new ListChatsReq();
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.listChats(req);

  return response.toObject();
}

export async function getChat(id: number) {
  const req = new GetChatReq();
  req.setChatId(id);
  const response = await client.conversations.getChat(req);
  return response.toObject();
}

export async function getChatMessages(
  chatId: number,
  lastMessageId: number = 0,
  count: number = 20
) {
  const req = new GetChatMessagesReq();
  req.setChatId(chatId);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.getChatMessages(req);

  return response.toObject();
}

export async function createChat(
  title: string,
  users: User.AsObject[]
): Promise<number> {
  const req = new CreateChatReq();
  req.setRecipientUserIdsList(users.map((user) => user.userId));
  req.setTitle(new StringValue().setValue(title));
  const response = await client.conversations.createChat(req);
  const chatId = response.getChatId();

  return chatId;
}

export async function sendMessage(chatId: number, text: string) {
  const req = new SendMessageReq();
  req.setChatId(chatId);
  req.setText(text);
  return await client.conversations.sendMessage(req);
}

export function leaveChat(chatId: number) {
  const req = new LeaveChatReq();
  req.setChatId(chatId);
  return client.conversations.leaveChat(req);
}

export function inviteToChat(chatId: number, users: User.AsObject[]) {
  const promises = users.map((user) => {
    const req = new InviteToChatReq();
    req.setChatId(chatId);
    req.setUserId(user.userId);
    return client.conversations.inviteToChat(req);
  });
  return Promise.all(promises);
}

export function makeChatAdmin(chatId: number, user: User.AsObject) {
  const req = new MakeChatAdminReq();
  req.setChatId(chatId);
  req.setUserId(user.userId);
  return client.conversations.makeChatAdmin(req);
}

export function removeChatAdmin(chatId: number, user: User.AsObject) {
  const req = new RemoveChatAdminReq();
  req.setChatId(chatId);
  req.setUserId(user.userId);
  return client.conversations.removeChatAdmin(req);
}

export function editChat(
  chatId: number,
  title?: string,
  onlyAdminsInvite?: boolean
) {
  const req = new EditChatReq();
  req.setChatId(chatId);
  if (title !== undefined) req.setTitle(new StringValue().setValue(title));
  if (onlyAdminsInvite !== undefined)
    req.setOnlyAdminsInvite(new BoolValue().setValue(onlyAdminsInvite));
  return client.conversations.editChat(req);
}

export function markLastSeenChat(chatId: number, lastSeenMessageId: number) {
  const req = new MarkLastSeenChatReq();
  req.setChatId(chatId);
  req.setLastSeenMessageId(lastSeenMessageId);
  return client.conversations.markLastSeenChat(req);
}

export async function getDirectMessage(userId: number) {
  const req = new GetDirectMessageReq();
  req.setUserId(userId);
  try {
    const res = await client.conversations.getDirectMessage(req);
    return res.getChatId();
  } catch (e) {
    if (isGrpcError(e) && e.code === StatusCode.NOT_FOUND) {
      return false;
    } else {
      throw e;
    }
  }
}
