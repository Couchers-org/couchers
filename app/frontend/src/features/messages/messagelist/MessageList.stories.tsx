import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import MessageList, {
  MessageListProps,
} from "features/messages/messagelist/MessageList";
import { Message } from "pb/conversations_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

const message1: Message.AsObject = {
  messageId: 1,
  authorUserId: 1,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "See you then!" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};
const message2: Message.AsObject = {
  messageId: 2,
  authorUserId: 2,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: {
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent iaculis pharetra auctor. Mauris vel malesuada sapien. Nam interdum lorem cursus nibh pulvinar sollicitudin. Nullam consectetur nunc augue, sit amet consequat orci egestas in. Sed elementum metus et risus rhoncus commodo.`,
  },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};
const message3: Message.AsObject = {
  messageId: 3,
  authorUserId: 1,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "Could I surf your couch?" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};

export default {
  title: "Messages/MessageList",
  component: MessageList,
  argTypes: {
    markLastSeen: {
      action: "markLastSeen",
    },
  },
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
} as Meta;

const Template: Story<MessageListProps> = (args) => <MessageList {...args} />;

export const Empty = Template.bind({});
Empty.args = {
  messages: [],
};

export const Filled = Template.bind({});
Filled.args = { messages: [message1, message2, message3] };
