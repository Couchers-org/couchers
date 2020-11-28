import * as React from "react";
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Meta, Story } from "@storybook/react/types-6-0";
import { Provider } from "react-redux";
import { store } from "../../../store";
import GroupChatsTab from "./GroupChatsTab";

import MessageView, { MessageProps } from "../messagelist/Message";
import { mockedService } from "../../../__mocks__/service";

Object.assign(mockedService, {
  conversations: {
    listGroupChats: () =>
      Promise.resolve([
        {
          groupChatId: 3,
          title: "groupchattitle",
          memberUserIdsList: [],
          adminUserIdsList: [],
          onlyAdminsInvite: true,
          isDm: false,
          // created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
          unseenMessageCount: 0,
          lastSeenMessageId: 4,
          latestMessage: message,
        },
      ]),
    getGroupChatMessages: () => Promise.resolve([message, message2]),
  },
});

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

const message: MessageProps["message"] = {
  messageId: 1,
  authorUserId: 2,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "testtext" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};
const message2: MessageProps["message"] = {
  messageId: 2,
  authorUserId: 2,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "testtext" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Collapsed = MessageTemplate.bind({});
Collapsed.args = { message };
