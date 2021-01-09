import { configureStore } from "@reduxjs/toolkit";
import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { Provider } from "react-redux";
import rootReducer from "../../../reducers";
import { groupChat, mockedService } from "../../../stories/__mocks__/service";
import { store } from "../../../stories/__mocks__/store";
import messages from "../../../test/fixtures/messages.json";
import AuthProvider from "../../auth/AuthProvider";
import GroupChatsTab from "./GroupChatsTab";
import GroupChatView from "./GroupChatView";

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
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Provider store={usedStore}>{storyFn()}</Provider>
          </AuthProvider>
        </QueryClientProvider>
      );
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

const GroupChatViewTemplate: Story<any> = (args) => {
  mockedService.conversations.leaveGroupChat = async () => {
    throw new Error("impossible to leave");
  };
  return <GroupChatView {...args} />;
};

export const View = GroupChatViewTemplate.bind({});
View.args = { state: chatGroupViewState };
