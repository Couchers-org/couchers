import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import ChatsTab from "features/messages/chats/ChatsTab";
import ChatView from "features/messages/chats/ChatView";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { MemoryRouter, Route } from "react-router-dom";
import { chatsRoute, routeToChat } from "routes";
import { mockedService } from "stories/serviceMocks";
import messages from "test/fixtures/messages.json";

const queryClient = new QueryClient();

export default {
  argTypes: {},
  component: ChatsTab,
  decorators: [
    (storyFn) => {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{storyFn()}</AuthProvider>
        </QueryClientProvider>
      );
    },
  ],
  title: "Messages/ChatsTab",
} as Meta;

mockedService.conversations.getChatMessages = async () => ({
  lastMessageId: 0,
  messagesList: messages,
  noMore: true,
});

mockedService.conversations.createChat = async () => {
  return 1234;
};

const Template: Story = (args) => {
  mockedService.conversations.leaveChat = async () => {
    return new Empty();
  };
  return <ChatsTab {...args} />;
};

export const Tab = Template.bind({});
Tab.args = {};

const ChatViewTemplate: Story<any> = (args) => {
  mockedService.conversations.leaveChat = async () => {
    throw new Error("impossible to leave");
  };
  return (
    <MemoryRouter initialEntries={[routeToChat(3)]}>
      <Route path={`${chatsRoute}/:chatId?`}>
        <ChatView {...args} />
      </Route>
    </MemoryRouter>
  );
};

export const Chat = ChatViewTemplate.bind({});
