import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchGroupChatsThunk,
  fetchMessagesThunk,
  leaveGroupChatThunk,
  sendMessageThunk,
} from ".";
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
    setMessages(state, action: PayloadAction<Message.AsObject[]>) {
      state.groupChatView.messages = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroupChatsThunk.pending, (state) => {
        state.error = "";
        state.loading = true;
      })
      .addCase(fetchGroupChatsThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchGroupChatsThunk.rejected, (state, action) => {
        state.error = action.error.message || "";
        state.loading = false;
      })
      .addCase(fetchMessagesThunk.pending, (state) => {
        state.groupChatView.error = "";
        state.groupChatView.loading = true;
      })
      .addCase(fetchMessagesThunk.fulfilled, (state) => {
        state.groupChatView.loading = false;
      })
      .addCase(fetchMessagesThunk.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
        state.groupChatView.loading = false;
      })
      .addCase(leaveGroupChatThunk.pending, (state) => {
        state.groupChatView.error = "";
      })
      .addCase(leaveGroupChatThunk.fulfilled, (state) => {})
      .addCase(leaveGroupChatThunk.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
      })
      .addCase(sendMessageThunk.pending, (state) => {
        state.groupChatView.error = "";
        state.groupChatView.loading = true;
      })
      .addCase(sendMessageThunk.fulfilled, (state) => {
        state.groupChatView.loading = false;
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        state.groupChatView.error = action.error.message || "";
        state.groupChatView.loading = false;
      });
  },
});

export const {
  groupChatsFetched,
  setGroupChat,
  setMessages,
} = groupChatsSlice.actions;
export default groupChatsSlice.reducer;
