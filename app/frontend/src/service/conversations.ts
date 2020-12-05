import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { User } from "../pb/api_pb";
import {
  CreateGroupChatReq,
  GetGroupChatMessagesReq,
  GroupChat,
  LeaveGroupChatReq,
  ListGroupChatsReq,
  Message,
  SendMessageReq,
} from "../pb/conversations_pb";
import client from "./client";

export async function listGroupChats(): Promise<GroupChat.AsObject[]> {
  const req = new ListGroupChatsReq();

  const response = await client.conversations.listGroupChats(req);
  const groupChats = response.getGroupChatsList();

  return groupChats.map((groupChat) => groupChat.toObject());
}

export async function getGroupChatMessages(
  groupChatId: number
): Promise<Message.AsObject[]> {
  const req = new GetGroupChatMessagesReq();
  req.setGroupChatId(groupChatId);

  const response = await client.conversations.getGroupChatMessages(req);
  const messages = response.getMessagesList();

  return messages.map((message) => message.toObject());
}

export async function createGroupChat(
  title: string,
  users: User.AsObject[]
): Promise<number> {
  const req = new CreateGroupChatReq();
  req.setRecipientUserIdsList(users.map((user) => user.userId));
  req.setTitle(new StringValue().setValue(title));
  const response = await client.conversations.createGroupChat(req);
  const groupChatId = response.getGroupChatId();

  return groupChatId;
}

export async function sendMessage(groupChatId: number, text: string) {
  const req = new SendMessageReq();
  req.setGroupChatId(groupChatId);
  req.setText(text);
  return await client.conversations.sendMessage(req);
}

export async function leaveGroupChat(groupChatId: number) {
  const req = new LeaveGroupChatReq();
  req.setGroupChatId(groupChatId);
  return await client.conversations.leaveGroupChat(req);
}
