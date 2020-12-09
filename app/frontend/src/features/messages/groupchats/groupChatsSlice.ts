import { observable } from "mobx";
import { User } from "../../../pb/api_pb";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { service } from "../../../service";

export const initialState = observable({
  groupChats: [] as GroupChat.AsObject[],
  error: "",
  loading: false,
  groupChatView: {
    groupChat: null as GroupChat.AsObject | null,
    messages: [] as Message.AsObject[],
    error: "",
    loading: false,
  },
});

export const fetchMessages = async (groupChat: GroupChat.AsObject) => {
  const self = groupChatsState.groupChatView;
  self.error = "";
  self.loading = true;
  try {
    self.messages = await service.conversations.getGroupChatMessages(
      groupChat.groupChatId
    );
  } catch (error) {
    self.error = error.message;
  }
  self.loading = false;
};
export const sendMessage = async (
  groupChat: GroupChat.AsObject,
  text: string
) => {
  const self = groupChatsState.groupChatView;
  self.error = "";
  self.loading = true;
  try {
    await service.conversations.sendMessage(groupChat.groupChatId, text);
    await fetchMessages(groupChat);
  } catch (error) {
    self.error = error.message!;
  }
  self.loading = false;
};
export const setGroupChat = async (groupChat: GroupChat.AsObject | null) => {
  const self = groupChatsState.groupChatView;
  self.error = "";
  self.loading = true;
  try {
    self.groupChat = groupChat;
    if (groupChat) {
      await fetchMessages(groupChat);
    }
  } catch (error) {
    self.error = error.message;
  }
  self.loading = false;
};
export const leaveGroupChat = async (groupChat: GroupChat.AsObject) => {
  const self = groupChatsState.groupChatView;
  self.error = "";
  self.loading = true;
  try {
    await service.conversations.leaveGroupChat(groupChat.groupChatId);
    await fetchGroupChats();
    self.groupChat = null;
  } catch (error) {
    self.error = error.message;
  }
  self.loading = false;
};
export const fetchGroupChats = async () => {
  const self = groupChatsState;
  self.error = "";
  self.loading = true;
  try {
    self.groupChats = await service.conversations.listGroupChats();
  } catch (error) {
    self.error = error.message!;
  }
  self.loading = false;
};
export const createGroupChat = async (
  title: string,
  users: User.AsObject[]
) => {
  const self = groupChatsState;
  self.error = "";
  self.loading = true;
  try {
    const groupChatId = await service.conversations.createGroupChat(
      title,
      users
    );
    await fetchGroupChats();
    const groupChat =
      self.groupChats.find(
        (groupChat) => groupChat.groupChatId === groupChatId
      ) || null;
    setGroupChat(groupChat);
  } catch (error) {
    self.error = error.message!;
  }
  self.loading = false;
};

export const groupChatsState = initialState;
