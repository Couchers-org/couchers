import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import messages from "../../test/fixtures/messages.json";

import Messages from "./index";
import MessageView, { MessageProps } from "./messagelist/MessageView";
import AuthProvider from "../auth/AuthProvider";
import { QueryClient, QueryClientProvider } from "react-query";
import { Route } from "react-router-dom";

const [message1] = messages;

export default {
  title: "Messages",
  component: Messages,
  argTypes: {},
  decorators: [
    (storyFn) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Route path="*">{storyFn()}</Route>
          </AuthProvider>
        </QueryClientProvider>
      );
    },
  ],
} as Meta;

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Message = MessageTemplate.bind({});
Message.args = { message: message1 };
