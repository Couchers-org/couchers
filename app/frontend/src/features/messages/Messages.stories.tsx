import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";
import messages from "../../test/fixtures/messages.json";
import { store } from "../../store";

import Messages from "./index";
import MessageView, { MessageProps } from "./messagelist/Message";
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
            <Provider store={store}>
              <Route path="*">{storyFn()}</Route>
            </Provider>
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
