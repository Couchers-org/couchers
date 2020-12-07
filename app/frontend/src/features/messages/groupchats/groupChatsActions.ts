import { createAsyncThunk } from "@reduxjs/toolkit";
import { User } from "../../../pb/api_pb";
import { GroupChat } from "../../../pb/conversations_pb";
import { RootState } from "../../../reducers";
import { service } from "../../../service";
import { groupChatsFetched, setGroupChat, setMessages } from ".";

type FetchGroupChatsArguments = void;

export const fetchGroupChatsThunk = createAsyncThunk<
  void,
  FetchGroupChatsArguments,
  { state: RootState }
>("hostRequests/fetchGroupChats", async (_, thunkApi) => {
  const groupChats = await service.conversations.listGroupChats();
  thunkApi.dispatch(groupChatsFetched(groupChats));
});

export const fetchMessagesThunk = createAsyncThunk<
  void,
  GroupChat.AsObject,
  { state: RootState }
>("hostRequests/fetchMessages", async (groupChat, thunkApi) => {
  const messages = await service.conversations.getGroupChatMessages(
    groupChat.groupChatId
  );
  thunkApi.dispatch(setMessages(messages));
});

export const createGroupChatThunk = createAsyncThunk<
  void,
  { title: string; users: User.AsObject[] },
  { state: RootState }
>("hostRequests/setGroupChat", async ({ title, users }, thunkApi) => {
  const groupChatId = await service.conversations.createGroupChat(title, users);
  thunkApi.dispatch(fetchGroupChatsThunk());
  const groupChat =
    thunkApi
      .getState()
      .groupChats.groupChats.find(
        (groupChat: GroupChat.AsObject) => groupChat.groupChatId === groupChatId
      ) || null;
  thunkApi.dispatch(setGroupChat(groupChat));
});

export const leaveGroupChatThunk = createAsyncThunk<
  void,
  GroupChat.AsObject,
  { state: RootState }
>("hostRequests/leaveGroupChat", async (groupChat, thunkApi) => {
  await service.conversations.leaveGroupChat(groupChat.groupChatId);
  thunkApi.dispatch(setGroupChat(null));
  thunkApi.dispatch(fetchGroupChatsThunk());
});

export const sendMessageThunk = createAsyncThunk<
  void,
  { groupChat: GroupChat.AsObject; text: string },
  { state: RootState }
>("hostRequests/sendMessage", async ({ groupChat, text }, thunkApi) => {
  await service.conversations.sendMessage(groupChat.groupChatId, text);
  thunkApi.dispatch(fetchMessagesThunk(groupChat));
});
