import { flow, getParent, Instance, types } from "mobx-state-tree";
import { GroupChat, Message } from "../../../pb/conversations_pb";
import { service } from "../../../service";

export const initialState = {
  groupChats: [],
  error: "",
  loading: false,
  groupChatView: {
    groupChat: null,
    messages: [],
    error: "",
    loading: false,
  },
};

export const GroupChatsModel = types
  .model({
    groupChats: types.array(types.frozen<GroupChat.AsObject>()),
    error: types.string,
    loading: types.boolean,
    groupChatView: types
      .model({
        error: types.string,
        loading: types.boolean,
        messages: types.array(types.frozen<Message.AsObject>()),
        groupChat: types.maybeNull(types.frozen<GroupChat.AsObject>()),
      })
      .actions((self) => {
        const fetchMessages = flow(function* (groupChat) {
          self.error = "";
          self.loading = true;
          try {
            self.messages = yield service.conversations.getGroupChatMessages(
              groupChat.groupChatId
            );
          } catch (error) {
            self.error = error.message;
          }
          self.loading = false;
        });
        const sendMessage = flow(function* (groupChat, text) {
          self.error = "";
          self.loading = true;
          try {
            yield service.conversations.sendMessage(
              groupChat.groupChatId,
              text
            );
            yield fetchMessages(groupChat);
          } catch (error) {
            self.error = error.message!;
          }
          self.loading = false;
        });
        const setGroupChat = flow(function* (groupChat) {
          self.error = "";
          self.loading = true;
          try {
            self.groupChat = groupChat;
            if (groupChat) {
              yield fetchMessages(groupChat);
            }
          } catch (error) {
            self.error = error.message;
          }
          self.loading = false;
        });
        const leaveGroupChat: (
          groupChat: GroupChat.AsObject
        ) => Promise<void> = flow(function* (groupChat) {
          self.error = "";
          self.loading = true;
          try {
            yield service.conversations.leaveGroupChat(groupChat.groupChatId);
            yield getParent<GroupChats>(self).fetchGroupChats();
            self.groupChat = null;
          } catch (error) {
            self.error = error.message;
          }
          self.loading = false;
        });
        return { sendMessage, setGroupChat, leaveGroupChat };
      }),
  })
  .actions((self) => {
    const fetchGroupChats = flow(function* () {
      self.error = "";
      self.loading = true;
      try {
        self.groupChats = yield service.conversations.listGroupChats();
      } catch (error) {
        self.error = error.message!;
      }
      self.loading = false;
    });
    const createGroupChat = flow(function* (title, users) {
      self.error = "";
      self.loading = true;
      try {
        const groupChatId = yield service.conversations.createGroupChat(
          title,
          users
        );
        yield fetchGroupChats();
        const groupChat =
          self.groupChats.find(
            (groupChat) => groupChat.groupChatId === groupChatId
          ) || null;
        self.groupChatView.setGroupChat(groupChat);
      } catch (error) {
        self.error = error.message!;
      }
      self.loading = false;
    });
    return {
      fetchGroupChats,
      createGroupChat,
    };
  });

export type GroupChats = Instance<typeof GroupChatsModel>;
export const groupChatsState = GroupChatsModel.create(initialState);
