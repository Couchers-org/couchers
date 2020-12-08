import { createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { RootState } from "../../../reducers";
import { service } from "../../../service";

export const fetchGroupChats = createAsyncThunk(
  "hostRequests/fetchGroupChats",
  async () => {
    const groupChats = await service.conversations.listGroupChats();
    return groupChats;
  }
);

export const fetchMessages = createAsyncThunk(
  "hostRequests/fetchMessages",
  async (groupChat: GroupChat.AsObject) => {
    return service.conversations.getGroupChatMessages(groupChat.groupChatId);
  }
);

export const setGroupChat = createAsyncThunk(
  "hostRequests/setGroupChat",
  async (groupChat: GroupChat.AsObject, thunkApi) => {
    if (groupChat) {
      thunkApi.dispatch(fetchMessages(groupChat));
    }
    return groupChat;
  }
);

export const createGroupChat = createAsyncThunk<
  GroupChat.AsObject | null,
  { title: string; users: User.AsObject[] },
  { state: RootState }
>("hostRequests/createGroupChat", async ({ title, users }, thunkApi) => {
  const groupChatId = await service.conversations.createGroupChat(title, users);
  await thunkApi.dispatch(fetchGroupChats());
  return (
    thunkApi
      .getState()
      .groupChats.groupChats.find(
        (groupChat: GroupChat.AsObject) => groupChat.groupChatId === groupChatId
      ) || null
  );
});

export const leaveGroupChat = createAsyncThunk(
  "hostRequests/leaveGroupChat",
  async (groupChat: GroupChat.AsObject, thunkApi) => {
    await service.conversations.leaveGroupChat(groupChat.groupChatId);
    thunkApi.dispatch(fetchGroupChats());
  }
);

export const sendMessage = createAsyncThunk(
  "hostRequests/sendMessage",
  async (
    { groupChat, text }: { groupChat: GroupChat.AsObject; text: string },
    thunkApi
  ) => {
    await service.conversations.sendMessage(groupChat.groupChatId, text);
    thunkApi.dispatch(fetchMessages(groupChat));
  }
);
