import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchGroupChats, fetchMessages, leaveGroupChat, sendMessage } from ".";
import { GroupChat, Message } from "../../../pb/conversations_pb";

const initialState = {
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
export const setMessages = createAction<Message.AsObject[]>("setMessages");

export const groupChatsSlice = createSlice({
  name: "groupChats",
  initialState,
  reducers: {
    groupChatsFetched(state, action: PayloadAction<GroupChat.AsObject[]>) {
      state.groupChats = action.payload;
    },
    setGroupChat(state, action: PayloadAction<GroupChat.AsObject | null>) {
      state.groupChatView.groupChat = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setMessages, (state, action) => {
        state.groupChatView.messages = action.payload;
      })
      .addCase(fetchGroupChats.pending, (state) => {
        state.error = "";
        state.loading = true;
      })
      .addCase(fetchGroupChats.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchGroupChats.rejected, (state, action) => {
        state.error = action.error.message || "";
        state.loading = false;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.groupChatView.error = "";
        state.groupChatView.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state) => {
        state.groupChatView.loading = false;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
        state.groupChatView.loading = false;
      })
      .addCase(leaveGroupChat.pending, (state) => {
        state.groupChatView.error = "";
      })
      .addCase(leaveGroupChat.fulfilled, (state) => {})
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

export const { groupChatsFetched, setGroupChat } = groupChatsSlice.actions;
export default groupChatsSlice.reducer;
