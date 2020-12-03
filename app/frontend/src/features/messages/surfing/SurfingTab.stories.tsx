import { configureStore, Store } from "@reduxjs/toolkit";
import { Meta, Story } from "@storybook/react/types-6-0";
import * as React from "react";
import { Provider } from "react-redux";

import { mockedService, user1 } from "../../../stories/__mocks__/service";
import { User } from "../../../pb/api_pb";
import * as pb_conversations_pb from "../../../pb/conversations_pb";
import { Message } from "../../../pb/conversations_pb";
import { HostRequest } from "../../../pb/requests_pb";
import rootReducer from "../../../reducers";
import SurfingTab from "./SurfingTab";

const message1: Message.AsObject = {
  messageId: 1,
  authorUserId: 2,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "Hi Funny Cat, can I surf your couch?" },
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
  authorUserId: 1,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "Sure." },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};

const hostRequest1: HostRequest.AsObject = {
  hostRequestId: 1,
  fromUserId: 2,
  toUserId: 1,
  status: pb_conversations_pb.HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
  created: { seconds: Math.round(Date.now() / 1e3) - 3 * 60 * 60, nanos: 0 },
  fromDate: "2021-01-01",
  toDate: "2021-01-03",
  lastSeenMessageId: 1,
  latestMessage: message2,
};

function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

Object.assign(mockedService, {
  requests: {
    async getHostRequestMessages() {
      await wait(1e3);
      return Promise.resolve([message2, message1]);
    },
  },
});

let store: Store;
function resetStore() {
  store = configureStore({
    reducer: rootReducer,
    preloadedState: { auth: { user: user1 as User.AsObject } },
  });
}

export default {
  title: "SurfingTab",
  component: SurfingTab,
  argTypes: {},
  decorators: [
    (storyFn) => {
      resetStore();
      return <Provider store={store}>{storyFn()}</Provider>;
    },
  ],
} as Meta;

const Template: Story<any> = (args) => {
  mockedService.requests.listHostRequests = async () => {
    await wait(1e3);
    if (args.failing) {
      throw new Error("An error happened!");
    }
    return [hostRequest1];
  };
  return <SurfingTab />;
};

export const Tab = Template.bind({});
Tab.args = {};

export const Failing = Template.bind({});
Failing.args = { failing: true };
