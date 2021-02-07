import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

import { groupChat, mockedService } from "../../../stories/__mocks__/service";
import messages from "../../../test/fixtures/messages.json";
import AuthProvider from "../../auth/AuthProvider";
import GroupChatsTab from "./GroupChatsTab";
import GroupChatView from "./GroupChatView";

const queryClient = new QueryClient();

export default {
  title: "GroupChatsTab",
  component: GroupChatsTab,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{storyFn()}</AuthProvider>
        </QueryClientProvider>
      );
    },
  ],
} as Meta;

mockedService.conversations.getGroupChatMessages = async () => ({
  messagesList: messages,
  noMore: true,
  lastMessageId: 0,
});

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

export const Chat = GroupChatViewTemplate.bind({});
Chat.args = { groupChat, setGroupChat: () => null };
