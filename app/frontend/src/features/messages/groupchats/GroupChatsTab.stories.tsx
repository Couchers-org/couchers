import { configureStore, createStore } from "@reduxjs/toolkit";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { Provider } from "react-redux";
import rootReducer from "../../../reducers";
import { groupChat, mockedService } from "../../../stories/__mocks__/service";
import { store } from "../../../stories/__mocks__/store";
import messages from "../../../test/fixtures/messages.json";
import MessageView, { MessageProps } from "../messagelist/Message";
import GroupChatsTab from "./GroupChatsTab";
import GroupChatView from "./GroupChatView";

const [message1] = messages;

const state = store.getState();
const chatGroupViewState = {
  ...state,
  groupChats: {
    ...state.groupChats,
    groupChatView: {
      ...state.groupChats.groupChatView,
      groupChat,
      messages,
    },
  },
};

export default {
  title: "GroupChatsTab",
  component: GroupChatsTab,
  argTypes: {},
  decorators: [
    (storyFn, { args }) => {
      const usedStore = configureStore({
        reducer: rootReducer,
        preloadedState: args.state || state,
      });

      return <Provider store={usedStore}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

mockedService.conversations.createGroupChat = async () => {
  return 1234;
};

const Template: Story = (args) => {
  mockedService.conversations.leaveGroupChat = async () => {
    return new Empty();
  };
  return <GroupChatsTab {...args} />;
};

export const Tab = Template.bind({});
Tab.args = {};

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Collapsed = MessageTemplate.bind({});
Collapsed.args = { message: message1 };

const GroupChatViewTemplate: Story<any> = (args) => {
  mockedService.conversations.leaveGroupChat = async () => {
    throw new Error("impossible to leave");
  };
  return <GroupChatView {...args} />;
};

export const View = GroupChatViewTemplate.bind({});
View.args = { state: chatGroupViewState };
