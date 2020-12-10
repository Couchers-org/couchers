import { observable } from "mobx";
import { User } from "../../../pb/api_pb";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { service } from "../../../service";

export const groupChatsState = observable({
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

export const fetchGroupChats = async () => {
  const state = groupChatsState;
  state.groupChats = await service.conversations.listGroupChats();
};

export const fetchMessages = async (groupChat: GroupChat.AsObject) => {
  const state = groupChatsState.groupChatView;
  state.messages = await service.conversations.getGroupChatMessages(
    groupChat.groupChatId
  );
};

export const sendMessage = async (
  groupChat: GroupChat.AsObject,
  text: string
) => {
  const state = groupChatsState.groupChatView;
  await service.conversations.sendMessage(groupChat.groupChatId, text);
  await fetchMessages(groupChat);
};

export const setGroupChat = async (groupChat: GroupChat.AsObject | null) => {
  const state = groupChatsState.groupChatView;
  state.groupChat = groupChat;
  if (groupChat) {
    await fetchMessages(groupChat);
  }
};

export const leaveGroupChat = async (groupChat: GroupChat.AsObject) => {
  const state = groupChatsState.groupChatView;
  await service.conversations.leaveGroupChat(groupChat.groupChatId);
  await fetchGroupChats();
  state.groupChat = null;
};

export const createGroupChat = async (
  title: string,
  users: User.AsObject[]
) => {
  const state = groupChatsState;
  const groupChatId = await service.conversations.createGroupChat(title, users);
  await fetchGroupChats();
  const groupChat =
    state.groupChats.find(
      (groupChat) => groupChat.groupChatId === groupChatId
    ) || null;
  setGroupChat(groupChat);
};

export function handleLoadingAndError(
  state: { loading: boolean; error: string },
  target: (...args: any[]) => Promise<any>
) {
  return async function (...args: any[]) {
    state.error = "";
    state.loading = true;
    try {
      await target(...args);
    } catch (error) {
      state.error = error.message;
    }
    state.loading = false;
  };
}
