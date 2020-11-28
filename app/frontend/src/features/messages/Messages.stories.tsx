import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";
import { message1 } from "../../__mocks__/service";
import { store } from "../../store";

import Messages from "./index";
import MessageView, { MessageProps } from "./messagelist/Message";

export default {
  title: "Messages",
  component: Messages,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return <Provider store={store}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

const Template: Story<any> = (args) => <Messages {...args} />;

export const Assembled = Template.bind({});
Assembled.args = {};

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Collapsed = MessageTemplate.bind({});
Collapsed.args = { message: message1 };
