import { Meta, Story } from "@storybook/react";
import * as React from "react";

import messages from "../../test/fixtures/messages.json";
import { addDefaultUser } from "../../test/utils";
import AuthProvider from "../auth/AuthProvider";
import Messages from "./index";
import ControlMessageView from "./messagelist/ControlMessageView";
import MessageView, { MessageProps } from "./messagelist/MessageView";

const [controlMessage, message1] = messages;

addDefaultUser(1);

export default {
  title: "Messages/MessageView",
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
