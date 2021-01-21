import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import messages from "../../test/fixtures/messages.json";

import Messages from "./index";
import MessageView, { MessageProps } from "./messagelist/MessageView";
import ControlMessageView from "./messagelist/ControlMessageView";
import AuthProvider from "../auth/AuthProvider";
import { addDefaultUser } from "../../test/utils";

const [controlMessage, message1] = messages;

addDefaultUser(1);

export default {
  title: "Messages",
  component: Messages,
  argTypes: {},
  decorators: [(story) => <AuthProvider>{story()}</AuthProvider>],
} as Meta;

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Message = MessageTemplate.bind({});
Message.args = { message: message1 };

const ControlMessageTemplate: Story<MessageProps> = (args) => (
  <ControlMessageView {...args} />
);

export const ControlMessage = ControlMessageTemplate.bind({});
ControlMessage.args = { message: controlMessage };
