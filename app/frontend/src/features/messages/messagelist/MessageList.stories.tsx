import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import MessageList, {
  MessageListProps,
} from "features/messages/messagelist/MessageList";
import { Message } from "pb/conversations_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

const message1: Message.AsObject = {
  authorUserId: 1,
  messageId: 1,
  text: {
    text: "See you then!",
  },
  time: {
    nanos: 0,
    seconds: Math.floor(+new Date(2020, 0, 1) / 1e3),
  },
};
const message2: Message.AsObject = {
  authorUserId: 2,
  messageId: 2,
  text: {
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent iaculis pharetra auctor. Mauris vel malesuada sapien. Nam interdum lorem cursus nibh pulvinar sollicitudin. Nullam consectetur nunc augue, sit amet consequat orci egestas in. Sed elementum metus et risus rhoncus commodo.`,
  },
  time: { nanos: 0, seconds: Math.floor(+new Date(2020, 0, 1) / 1e3) },
};
const message3: Message.AsObject = {
  authorUserId: 1,
  messageId: 3,
  text: { text: "Could I surf your couch?" },
  time: { nanos: 0, seconds: Math.floor(+new Date(2020, 0, 1) / 1e3) },
};

export default {
  argTypes: {
    markLastSeen: {
      action: "markLastSeen",
    },
  },
  component: MessageList,
  decorators: [
    (storyFn) => {
      const queryClient = new QueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>{storyFn()}</AuthProvider>
        </QueryClientProvider>
      );
    },
  ],
  title: "Messages/MessageList",
} as Meta;

const Template: Story<MessageListProps> = (args) => <MessageList {...args} />;

export const Empty = Template.bind({});
Empty.args = {
  messages: [],
};

export const Filled = Template.bind({});
Filled.args = { messages: [message1, message2, message3] };
