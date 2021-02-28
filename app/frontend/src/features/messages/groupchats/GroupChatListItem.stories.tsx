import { Meta, Story } from "@storybook/react";

import groupChat from "../../../test/fixtures/groupChat.json";
import GroupChatListItem from "./GroupChatListItem";

export default {
  title: "Messages/GroupChatListItem",
  component: GroupChatListItem,
} as Meta;

const Template: Story<any> = (args) => (
  <>
    <GroupChatListItem groupChat={groupChat} {...args} />
  </>
);

export const groupChatListItem = Template.bind({});
