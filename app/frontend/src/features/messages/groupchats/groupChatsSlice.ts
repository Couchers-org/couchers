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
  const state = groupChatsState.groupChatView;
  state.error = "";
  state.loading = true;
  try {
    state.messages = await service.conversations.getGroupChatMessages(
      groupChat.groupChatId
    );
  } catch (error) {
    state.error = error.message;
  }
  state.loading = false;
};
export const sendMessage = async (
  groupChat: GroupChat.AsObject,
  text: string
) => {
  const state = groupChatsState.groupChatView;
  state.error = "";
  state.loading = true;
  try {
    await service.conversations.sendMessage(groupChat.groupChatId, text);
    await fetchMessages(groupChat);
  } catch (error) {
    state.error = error.message!;
  }
  state.loading = false;
};
export const setGroupChat = async (groupChat: GroupChat.AsObject | null) => {
  const state = groupChatsState.groupChatView;
  state.error = "";
  state.loading = true;
  try {
    state.groupChat = groupChat;
    if (groupChat) {
      await fetchMessages(groupChat);
    }
  } catch (error) {
    state.error = error.message;
  }
  state.loading = false;
};
export const leaveGroupChat = async (groupChat: GroupChat.AsObject) => {
  const state = groupChatsState.groupChatView;
  state.error = "";
  state.loading = true;
  try {
    await service.conversations.leaveGroupChat(groupChat.groupChatId);
    await fetchGroupChats();
    state.groupChat = null;
  } catch (error) {
    state.error = error.message;
  }
  state.loading = false;
};
export const fetchGroupChats = async () => {
  const state = groupChatsState;
  state.error = "";
  state.loading = true;
  try {
    state.groupChats = await service.conversations.listGroupChats();
  } catch (error) {
    state.error = error.message!;
  }
  state.loading = false;
};
export const createGroupChat = async (
  title: string,
  users: User.AsObject[]
) => {
  const state = groupChatsState;
  state.error = "";
  state.loading = true;
  try {
    const groupChatId = await service.conversations.createGroupChat(
      title,
      users
    );
    await fetchGroupChats();
    const groupChat =
      state.groupChats.find(
        (groupChat) => groupChat.groupChatId === groupChatId
      ) || null;
    setGroupChat(groupChat);
  } catch (error) {
    state.error = error.message!;
  }
  state.loading = false;
};

export const groupChatsState = initialState;
