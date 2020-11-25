import { configureStore } from "@reduxjs/toolkit";
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";

import { user1 } from "../../../__mocks__/service";
import { Message } from "../../../pb/conversations_pb";
import rootReducer from "../../../reducers";
import MessageList, { MessageListProps } from "./MessageList";

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
    text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent iaculis pharetra auctor. Mauris vel malesuada sapien. Nam interdum lorem cursus nibh pulvinar sollicitudin. Nullam consectetur nunc augue, sit amet consequat orci egestas in. Sed elementum metus et risus rhoncus commodo. Aenean efficitur quam purus, eget iaculis ante rutrum vitae. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent elementum leo eget lacinia lobortis. Praesent placerat tellus non fringilla sodales. Duis pulvinar scelerisque urna, ut imperdiet ante pretium ac. Nulla id odio eu tellus vulputate condimentum. Sed nunc nisl, volutpat finibus bibendum vitae, condimentum nec mauris. In a justo a orci pulvinar scelerisque ut quis nulla. Vestibulum suscipit tortor feugiat risus sodales, at aliquet lacus dignissim. Curabitur rhoncus justo id dolor hendrerit pellentesque.

Curabitur metus nisl, semper sed vestibulum facilisis, malesuada ut mi. Cras arcu nisl, tincidunt eu feugiat eu, laoreet quis sapien. Aenean convallis vel sapien ut sodales. Vivamus blandit sed quam et malesuada. Curabitur blandit massa sed volutpat ultrices. Proin bibendum est vitae erat mollis sagittis eu id erat. Cras elementum tempus ligula in tincidunt. Vivamus ac aliquet augue, eu finibus massa. Duis luctus tempor leo, non consequat orci. Vivamus tempus eget enim eget interdum. Integer tellus lorem, congue id euismod ut, iaculis at odio. Donec nibh nulla, ullamcorper ac semper vitae, varius id sapien. Ut efficitur id elit in fermentum.

Morbi at consectetur neque, ut eleifend velit. Morbi et eleifend nunc. Curabitur in semper ex, ac efficitur leo. Integer sit amet efficitur turpis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce congue aliquet justo quis congue. Pellentesque id convallis ligula. Suspendisse at euismod ipsum, id rhoncus dui. Quisque convallis tortor sed volutpat commodo. Duis varius justo vitae dapibus ultrices. Praesent mattis finibus ligula, id luctus risus lobortis ut. Nunc tellus ex, imperdiet in laoreet a, fermentum sit amet magna.

Cras sit amet diam euismod, ultrices nibh et, placerat metus. Integer nisl urna, imperdiet ac posuere vel, gravida eget risus. Suspendisse ac rhoncus elit. Nullam tristique elementum dignissim. In hac habitasse platea dictumst. Fusce at libero blandit, malesuada velit nec, malesuada magna. Maecenas feugiat ante ac odio pharetra, in lobortis nunc porttitor. In lacinia feugiat nibh, non dictum nulla semper eu.

Vivamus varius laoreet ligula, eu luctus quam mollis a. Mauris porta, lorem a egestas cursus, odio tortor sollicitudin leo, et eleifend nisi sem a est. Morbi congue eu augue eget blandit. Donec tempor ultrices neque in rhoncus. Integer vitae nunc quam. Vestibulum luctus blandit erat, et condimentum urna dictum vitae. Morbi condimentum est urna, dignissim euismod ex rhoncus at. Sed blandit placerat dolor, sit amet gravida dui gravida vel. Nullam dui augue, pulvinar vitae feugiat sit amet, semper eget tortor. Curabitur volutpat pulvinar velit nec accumsan. Vestibulum tincidunt tellus diam, ut rhoncus arcu lacinia vitae. Aliquam erat volutpat. Duis lacinia dolor vitae bibendum luctus. Aliquam aliquet sem vitae tellus ornare, ac luctus urna hendrerit. Quisque bibendum tellus vitae elementum laoreet.`,
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

const store = configureStore({
  reducer: rootReducer,
  preloadedState: { auth: { user: user1 } },
});

export default {
  title: "MessageList",
  component: MessageList,
  argTypes: {},
  decorators: [
    (storyFn) => {
      return <Provider store={store}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

const Template: Story<MessageListProps> = (args) => <MessageList {...args} />;

async function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

export const Empty = Template.bind({});
Empty.args = {
  messages: [],
};

export const Filled = Template.bind({});
Filled.args = { messages: [message1, message2, message3] };

export const ErrorOnSend = Template.bind({});
ErrorOnSend.args = {
  messages: [],
  handleSend: async (text: string) => {
    await wait(5e3);
    throw new Error("Fetch error");
  },
};
