import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";
import messages from "../../../test/fixtures/messages.json";
import { store } from "../../../store";

import MessageView, { MessageProps } from "../messagelist/Message";
import GroupChatsTab from "./GroupChatsTab";

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

const Template: Story = (args) => <GroupChatsTab {...args} />;

export const Tab = Template.bind({});
Tab.args = {};

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Collapsed = MessageTemplate.bind({});
Collapsed.args = { message: message1 };
