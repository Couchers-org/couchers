import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import * as React from "react";
import { Provider } from "react-redux";
import { store } from "../../../store";
import { groupChat, mockedService } from "../../../stories/__mocks__/service";
import messages from "../../../test/fixtures/messages.json";

import MessageView, { MessageProps } from "../messagelist/Message";
import GroupChatsTab from "./GroupChatsTab";
import GroupChatView, { GroupChatViewProps } from "./GroupChatView";

const [message1] = messages;

export default {
  title: "GroupChatsTab",
  component: GroupChatsTab,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return <Provider store={store}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

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
View.args = { groupChat };
