import { createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { RootState } from "../../../reducers";
import { service } from "../../../service";
import { groupChatsFetched, messagesFetched, groupChatSet } from ".";

type FetchGroupChatsArguments = void;

export const fetchGroupChats = createAsyncThunk<
  void,
  FetchGroupChatsArguments,
  { state: RootState }
>("hostRequests/fetchGroupChats", async (_, thunkApi) => {
  const groupChats = await service.conversations.listGroupChats();
  thunkApi.dispatch(groupChatsFetched(groupChats));
});

export const fetchMessages = createAsyncThunk<
  void,
  GroupChat.AsObject,
  { state: RootState }
>("hostRequests/fetchMessages", async (groupChat, thunkApi) => {
  const messages = await service.conversations.getGroupChatMessages(
    groupChat.groupChatId
  );
  thunkApi.dispatch(messagesFetched(messages));
});

export const setGroupChat = createAsyncThunk<
  void,
  GroupChat.AsObject | null,
  { state: RootState }
>("hostRequests/fetchMessages", async (groupChat, thunkApi) => {
  thunkApi.dispatch(groupChatSet(groupChat));
  if (groupChat) {
    thunkApi.dispatch(fetchMessages(groupChat));
  }
});

export const createGroupChat = createAsyncThunk<
  void,
  { title: string; users: User.AsObject[] },
  { state: RootState }
>("hostRequests/setGroupChat", async ({ title, users }, thunkApi) => {
  const groupChatId = await service.conversations.createGroupChat(title, users);
  thunkApi.dispatch(fetchGroupChats());
  const groupChat =
    thunkApi
      .getState()
      .groupChats.groupChats.find(
        (groupChat: GroupChat.AsObject) => groupChat.groupChatId === groupChatId
      ) || null;
  thunkApi.dispatch(setGroupChat(groupChat));
});

export const leaveGroupChat = createAsyncThunk<
  void,
  GroupChat.AsObject,
  { state: RootState }
>("hostRequests/leaveGroupChat", async (groupChat, thunkApi) => {
  await service.conversations.leaveGroupChat(groupChat.groupChatId);
  thunkApi.dispatch(setGroupChat(null));
  thunkApi.dispatch(fetchGroupChats());
});

export const sendMessage = createAsyncThunk<
  void,
  { groupChat: GroupChat.AsObject; text: string },
  { state: RootState }
>("hostRequests/sendMessage", async ({ groupChat, text }, thunkApi) => {
  await service.conversations.sendMessage(groupChat.groupChatId, text);
  thunkApi.dispatch(fetchMessages(groupChat));
});
