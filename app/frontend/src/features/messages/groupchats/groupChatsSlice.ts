import { createAction, createSlice } from "@reduxjs/toolkit";
import {
  fetchGroupChats,
  fetchMessages,
  leaveGroupChat,
  sendMessage,
  setGroupChat,
} from ".";
import { GroupChat, Message } from "../../../pb/conversations_pb";

export const initialState = {
  groupChats: [] as GroupChat.AsObject[],
  error: "",
  loading: false,
  groupChatView: {
    groupChat: null as GroupChat.AsObject | null,
    messages: [] as Message.AsObject[],
    error: "",
    loading: false,
  },
};

export type RequestsState = typeof initialState;
export const messagesFetched = createAction<Message.AsObject[]>(
  "messagesFetched"
);

export const groupChatsSlice = createSlice({
  name: "groupChats",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(setGroupChat.pending, (state) => {
        state.error = "";
        state.loading = true;
      })
      .addCase(setGroupChat.fulfilled, (state, action) => {
        state.groupChatView.groupChat = action.payload;
        state.loading = false;
      })
      .addCase(setGroupChat.rejected, (state, action) => {
        state.error = action.error.message!;
        state.loading = false;
      })
      .addCase(fetchGroupChats.pending, (state) => {
        state.error = "";
        state.loading = true;
      })
      .addCase(fetchGroupChats.fulfilled, (state, action) => {
        state.groupChats = action.payload;
        state.loading = false;
      })
      .addCase(fetchGroupChats.rejected, (state, action) => {
        state.error = action.error.message!;
        state.loading = false;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.groupChatView.error = "";
        state.groupChatView.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.groupChatView.messages = action.payload;
        state.groupChatView.loading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
        state.groupChatView.loading = false;
      })
      .addCase(leaveGroupChat.pending, (state) => {
        state.groupChatView.error = "";
      })
      .addCase(leaveGroupChat.fulfilled, (state) => {
        state.groupChatView.groupChat = null;
      })
      .addCase(leaveGroupChat.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
      })
      .addCase(sendMessage.pending, (state) => {
        state.groupChatView.error = "";
        state.groupChatView.loading = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.groupChatView.loading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
        state.groupChatView.loading = false;
      });
  },
});

export const {} = groupChatsSlice.actions;
export default groupChatsSlice.reducer;
