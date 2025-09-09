import {
  BoolValue,
  StringValue,
} from "google-protobuf/google/protobuf/wrappers_pb";
import { StatusCode } from "grpc-web";

import { LiteUser, User } from "@/proto/api_pb";
import {
  CreateGroupChatReq,
  EditGroupChatReq,
  GetDirectMessageReq,
  GetGroupChatMessagesReq,
  GetGroupChatReq,
  InviteToGroupChatReq,
  LeaveGroupChatReq,
  ListGroupChatsReq,
  MakeGroupChatAdminReq,
  MarkLastSeenGroupChatReq,
  MuteGroupChatReq,
  RemoveGroupChatAdminReq,
  SendMessageReq,
} from "@/proto/conversations_pb";

import client from "./client";
import { Duration, duration2pb } from "./utils/date";
import isGrpcError from "./utils/isGrpcError";

export const listGroupChats = async (lastMessageId = 0, count = 10) => {
  const req = new ListGroupChatsReq();
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.listGroupChats(req);

  return response.toObject();
};

export const getGroupChat = async (id: number) => {
  const req = new GetGroupChatReq();
  req.setGroupChatId(id);
  const response = await client.conversations.getGroupChat(req);
  return response.toObject();
};

export const getGroupChatMessages = async (
  groupChatId: number,
  lastMessageId = 0,
  count = 20,
) => {
  const req = new GetGroupChatMessagesReq();
  req.setGroupChatId(groupChatId);
  req.setLastMessageId(lastMessageId);
  req.setNumber(count);

  const response = await client.conversations.getGroupChatMessages(req);

  return response.toObject();
};

export const createGroupChat = async (
  title: string,
  users: User.AsObject[],
): Promise<number> => {
  const req = new CreateGroupChatReq();
  req.setRecipientUserIdsList(users.map((user) => user.userId));
  req.setTitle(new StringValue().setValue(title));
  const response = await client.conversations.createGroupChat(req);
  const groupChatId = response.getGroupChatId();

  return groupChatId;
};

export const sendMessage = async (groupChatId: number, text: string) => {
  const req = new SendMessageReq();
  req.setGroupChatId(groupChatId);
  req.setText(text);
  return await client.conversations.sendMessage(req);
};

export const leaveGroupChat = (groupChatId: number) => {
  const req = new LeaveGroupChatReq();
  req.setGroupChatId(groupChatId);
  return client.conversations.leaveGroupChat(req);
};

export const inviteToGroupChat = (
  groupChatId: number,
  users: User.AsObject[],
) => {
  const promises = users.map((user) => {
    const req = new InviteToGroupChatReq();
    req.setGroupChatId(groupChatId);
    req.setUserId(user.userId);
    return client.conversations.inviteToGroupChat(req);
  });
  return Promise.all(promises);
};

export const makeGroupChatAdmin = (
  groupChatId: number,
  user: LiteUser.AsObject,
) => {
  const req = new MakeGroupChatAdminReq();
  req.setGroupChatId(groupChatId);
  req.setUserId(user.userId);
  return client.conversations.makeGroupChatAdmin(req);
};

export const removeGroupChatAdmin = (
  groupChatId: number,
  user: LiteUser.AsObject,
) => {
  const req = new RemoveGroupChatAdminReq();
  req.setGroupChatId(groupChatId);
  req.setUserId(user.userId);
  return client.conversations.removeGroupChatAdmin(req);
};

export const editGroupChat = (
  groupChatId: number,
  title?: string,
  onlyAdminsInvite?: boolean,
) => {
  const req = new EditGroupChatReq();
  req.setGroupChatId(groupChatId);
  if (title !== undefined) req.setTitle(new StringValue().setValue(title));
  if (onlyAdminsInvite !== undefined)
    req.setOnlyAdminsInvite(new BoolValue().setValue(onlyAdminsInvite));
  return client.conversations.editGroupChat(req);
};

export const markLastSeenGroupChat = (
  groupChatId: number,
  lastSeenMessageId: number,
) => {
  const req = new MarkLastSeenGroupChatReq();
  req.setGroupChatId(groupChatId);
  req.setLastSeenMessageId(lastSeenMessageId);
  return client.conversations.markLastSeenGroupChat(req);
};

export const getDirectMessage = async (userId: number) => {
  const req = new GetDirectMessageReq();
  req.setUserId(userId);
  try {
    const res = await client.conversations.getDirectMessage(req);
    return res.getGroupChatId();
  } catch (e) {
    if (isGrpcError(e) && e.code === StatusCode.NOT_FOUND) {
      return false;
    } else {
      throw e;
    }
  }
};

export type MuteChatOptions = Pick<MuteGroupChatReq.AsObject, "groupChatId"> &
  Partial<Omit<MuteGroupChatReq.AsObject, "groupChatId" | "forDuration">> & {
    forDuration?: Duration;
  };

export const muteChat = async (options: MuteChatOptions) => {
  const req = new MuteGroupChatReq();
  req.setGroupChatId(options.groupChatId);
  if (options.unmute) req.setUnmute(true);
  if (options.forever) req.setForever(true);
  if (options.forDuration) req.setForDuration(duration2pb(options.forDuration));
  return client.conversations.muteGroupChat(req);
};
