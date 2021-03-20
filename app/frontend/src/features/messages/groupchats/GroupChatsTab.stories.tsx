import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import GroupChatsTab from "features/messages/groupchats/GroupChatsTab";
import GroupChatView from "features/messages/groupchats/GroupChatView";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route } from "react-router-dom";
import { groupChatsRoute, routeToGroupChat } from "routes";
import { mockedService } from "stories/__mocks__/service";
import messages from "test/fixtures/messages.json";

const queryClient = new QueryClient();

export default {
  argTypes: {},
  component: GroupChatsTab,
  decorators: [
    (storyFn) => {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{storyFn()}</AuthProvider>
        </QueryClientProvider>
      );
    },
  ],
  title: "Messages/GroupChatsTab",
} as Meta;

mockedService.conversations.getGroupChatMessages = async () => ({
  lastMessageId: 0,
  messagesList: messages,
  noMore: true,
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
  return (
    <MemoryRouter initialEntries={[routeToGroupChat(3)]}>
      <Route path={`${groupChatsRoute}/:groupChatId?`}>
        <GroupChatView {...args} />
      </Route>
    </MemoryRouter>
  );
};

export const Chat = GroupChatViewTemplate.bind({});
