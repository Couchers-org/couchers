import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import Messages from "features/messages/index";
import ControlMessageView from "features/messages/messagelist/ControlMessageView";
import MessageView, {
  MessageProps,
} from "features/messages/messagelist/MessageView";
import * as React from "react";
import messages from "test/fixtures/messages.json";
import { addDefaultUser } from "test/utils";

const [controlMessage, message1] = [messages[messages.length - 1], messages[0]];

addDefaultUser(1);

export default {
  component: Messages,
  decorators: [(story) => <AuthProvider>{story()}</AuthProvider>],
  title: "Messages/MessageView",
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
