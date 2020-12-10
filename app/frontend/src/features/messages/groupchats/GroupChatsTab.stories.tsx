import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { configure } from "mobx";
import * as React from "react";
import { Provider } from "react-redux";
import { groupChat, mockedService } from "../../../stories/__mocks__/service";
import { store } from "../../../stories/__mocks__/store";
import messages from "../../../test/fixtures/messages.json";
import MessageView, { MessageProps } from "../messagelist/Message";
import { setGroupChat } from "./groupChatsSlice";
import GroupChatsTab from "./GroupChatsTab";
import GroupChatView from "./GroupChatView";

configure({
  enforceActions: "never",
  computedRequiresReaction: true,
  reactionRequiresObservable: true,
  observableRequiresReaction: true,
  disableErrorBoundaries: true,
});

const [message1] = messages;

export default {
  title: "GroupChatsTab",
  component: GroupChatsTab,
  argTypes: {},
  decorators: [
    (storyFn, { args }) => {
      return <Provider store={store}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

mockedService.conversations.createGroupChat = async () => {
  return 1234;
};

const Template: Story = (args) => {
  setGroupChat(null);
  mockedService.conversations.leaveGroupChat = async () => {
    return new Empty();
  };
  return <GroupChatsTab {...args} />;
};

export const Tab = Template.bind({});
Tab.args = {};

const MessageTemplate: Story<MessageProps> = (args) => (
  <MessageView {...args} />
);

export const Collapsed = MessageTemplate.bind({});
Collapsed.args = { message: message1 };

const GroupChatViewTemplate: Story<any> = (args) => {
  setGroupChat(groupChat);
  mockedService.conversations.leaveGroupChat = async () => {
    throw new Error("impossible to leave");
  };
  return <GroupChatView {...args} />;
};

export const View = GroupChatViewTemplate.bind({});
View.args = {};
