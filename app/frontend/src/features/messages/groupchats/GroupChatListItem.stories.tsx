import { Meta, Story } from "@storybook/react";
import GroupChatListItem from "features/messages/groupchats/GroupChatListItem";
import groupChat from "test/fixtures/groupChat.json";

export default {
  component: GroupChatListItem,
  title: "Messages/GroupChatListItem",
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <GroupChatListItem groupChat={groupChat} {...args} />
  </>
);

export const groupChatListItem = Template.bind({});
