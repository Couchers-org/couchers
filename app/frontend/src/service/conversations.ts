import {
  BoolValue,
  StringValue,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { User } from "pb/api_pb";
import {
  CreateGroupChatReq,
  EditGroupChatReq,
  GetGroupChatMessagesReq,
  GetGroupChatReq,
  InviteToGroupChatReq,
  LeaveGroupChatReq,
  ListGroupChatsReq,
  MakeGroupChatAdminReq,
  MarkLastSeenGroupChatReq,
  RemoveGroupChatAdminReq,
  SendMessageReq,
} from "pb/conversations_pb";
import client from "service/client";

export async function listGroupChats(
  lastMessageId: number = 0,
  count: number = 10
) {
  const req = new ListGroupChatsReq();
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.listGroupChats(req);

  return response.toObject();
}

export async function getGroupChat(id: number) {
  const req = new GetGroupChatReq();
  req.setGroupChatId(id);
  const response = await client.conversations.getGroupChat(req);
  return response.toObject();
}

export async function getGroupChatMessages(
  groupChatId: number,
  lastMessageId: number = 0,
  count: number = 20
) {
  const req = new GetGroupChatMessagesReq();
  req.setGroupChatId(groupChatId);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.getGroupChatMessages(req);

  return response.toObject();
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

export function leaveGroupChat(groupChatId: number) {
  const req = new LeaveGroupChatReq();
  req.setGroupChatId(groupChatId);
  return client.conversations.leaveGroupChat(req);
}

export function inviteToGroupChat(groupChatId: number, users: User.AsObject[]) {
  const promises = users.map((user) => {
    const req = new InviteToGroupChatReq();
    req.setGroupChatId(groupChatId);
    req.setUserId(user.userId);
    return client.conversations.inviteToGroupChat(req);
  });
  return Promise.all(promises);
}

export function makeGroupChatAdmin(groupChatId: number, user: User.AsObject) {
  const req = new MakeGroupChatAdminReq();
  req.setGroupChatId(groupChatId);
  req.setUserId(user.userId);
  return client.conversations.makeGroupChatAdmin(req);
}

export function removeGroupChatAdmin(groupChatId: number, user: User.AsObject) {
  const req = new RemoveGroupChatAdminReq();
  req.setGroupChatId(groupChatId);
  req.setUserId(user.userId);
  return client.conversations.removeGroupChatAdmin(req);
}

export function editGroupChat(
  groupChatId: number,
  title?: string,
  onlyAdminsInvite?: boolean
) {
  const req = new EditGroupChatReq();
  req.setGroupChatId(groupChatId);
  if (title !== undefined) req.setTitle(new StringValue().setValue(title));
  if (onlyAdminsInvite !== undefined)
    req.setOnlyAdminsInvite(new BoolValue().setValue(onlyAdminsInvite));
  return client.conversations.editGroupChat(req);
}

export function markLastSeenGroupChat(
  groupChatId: number,
  lastSeenMessageId: number
) {
  const req = new MarkLastSeenGroupChatReq();
  req.setGroupChatId(groupChatId);
  req.setLastSeenMessageId(lastSeenMessageId);
  return client.conversations.markLastSeenGroupChat(req);
}
