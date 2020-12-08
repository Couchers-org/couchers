import { createAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { flow, Instance, types } from 'mobx-state-tree';
import {
  fetchGroupChats,
  fetchMessages,
  leaveGroupChat,
  sendMessage,
  setGroupChat,
} from ".";
import { User } from "../../../pb/api_pb";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { RootState } from "../../../reducers";
import { service } from "../../../service";

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

export const GroupChatsModel = types
  .model({
    groupChats: types.array(types.number),
    error: types.string,
    loading: types.boolean,
    groupChatView: types.model({
      error: types.string,
      loading: types.boolean,
      messages: types.array(types.frozen()),
      groupChat: types.maybeNull(types.frozen()),
    }),
  })
  .actions((self) => ({
    fetchGroupChats: flow(function* () {
      self.error = "";
      self.loading = true;
      try {
        self.groupChats = yield service.conversations.listGroupChats();
        self.loading = false;
      } catch (error) {
        self.error = error.message!;
        self.loading = false;
      }
    }),
  }));

export type GroupChats = Instance<typeof GroupChatsModel>;
export const groupChatsState = GroupChatsModel.create();

//
// export const fetchGroupChats = createAsyncThunk(
//   "hostRequests/fetchGroupChats",
//   async () => {
//     const groupChats = await service.conversations.listGroupChats();
//     return groupChats;
//   }
// );
//
// export const fetchMessages = createAsyncThunk(
//   "hostRequests/fetchMessages",
//   async (groupChat: GroupChat.AsObject) => {
//     return service.conversations.getGroupChatMessages(groupChat.groupChatId);
//   }
// );
//
// export const setGroupChat = createAsyncThunk(
//   "hostRequests/setGroupChat",
//   async (groupChat: GroupChat.AsObject, thunkApi) => {
//     if (groupChat) {
//       thunkApi.dispatch(fetchMessages(groupChat));
//     }
//     return groupChat;
//   }
// );
//
// export const createGroupChat = createAsyncThunk<
//   GroupChat.AsObject | null,
//   { title: string; users: User.AsObject[] },
//   { state: RootState }
// >("hostRequests/createGroupChat", async ({ title, users }, thunkApi) => {
//   const groupChatId = await service.conversations.createGroupChat(title, users);
//   await thunkApi.dispatch(fetchGroupChats());
//   return (
//     thunkApi
//       .getState()
//       .groupChats.groupChats.find(
//         (groupChat: GroupChat.AsObject) => groupChat.groupChatId === groupChatId
//       ) || null
//   );
// });
//
// export const leaveGroupChat = createAsyncThunk(
//   "hostRequests/leaveGroupChat",
//   async (groupChat: GroupChat.AsObject, thunkApi) => {
//     await service.conversations.leaveGroupChat(groupChat.groupChatId);
//     thunkApi.dispatch(fetchGroupChats());
//   }
// );
//
// export const sendMessage = createAsyncThunk(
//   "hostRequests/sendMessage",
//   async (
//     { groupChat, text }: { groupChat: GroupChat.AsObject; text: string },
//     thunkApi
//   ) => {
//     await service.conversations.sendMessage(groupChat.groupChatId, text);
//     thunkApi.dispatch(fetchMessages(groupChat));
//   }
// );

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
