import { Meta, Story } from "@storybook/react";
import ChatListItem from "features/messages/chats/ChatListItem";
import chat from "test/fixtures/chat.json";

export default {
  component: ChatListItem,
  title: "Messages/ChatListItem",
} as Meta;

const Template: Story<any> = (args) => <ChatListItem chat={chat} {...args} />;

export const chatListItem = Template.bind({});
