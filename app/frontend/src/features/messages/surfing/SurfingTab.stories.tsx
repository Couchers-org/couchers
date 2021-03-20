import { Meta, Story } from "@storybook/react";
import AuthProvider from "features/auth/AuthProvider";
import SurfingTab from "features/messages/surfing/SurfingTab";
import * as pb_conversations_pb from "pb/conversations_pb";
import { Message } from "pb/conversations_pb";
import { HostRequest } from "pb/requests_pb";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { mockedService } from "stories/__mocks__/service";

const message1: Message.AsObject = {
  authorUserId: 2,
  messageId: 1,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "Hi Funny Cat, can I surf your couch?" },
  time: { nanos: 0, seconds: Math.floor(+new Date(2020, 0, 1) / 1e3) },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};
const message2: Message.AsObject = {
  authorUserId: 1,
  messageId: 2,
  // time?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  text: { text: "Sure." },
  time: { nanos: 0, seconds: Math.floor(+new Date(2020, 0, 1) / 1e3) },
  // chatCreated?: MessageContentChatCreated.AsObject,
  // chatEdited?: MessageContentChatEdited.AsObject,
  // userInvited?: MessageContentUserInvited.AsObject,
  // userLeft?: MessageContentUserLeft.AsObject,
  // userMadeAdmin?: MessageContentUserMadeAdmin.AsObject,
  // userRemovedAdmin?: MessageContentUserRemovedAdmin.AsObject,
  // hostRequestStatusChanged?: MessageContentHostRequestStatusChanged.AsObject,
};

const hostRequest1: HostRequest.AsObject = {
  created: {
    nanos: 0,
    seconds: Math.round(Date.now() / 1e3) - 3 * 60 * 60,
  },
  fromDate: "2021-01-01",
  fromUserId: 2,
  hostRequestId: 1,
  lastSeenMessageId: 1,
  latestMessage: message2,
  status: pb_conversations_pb.HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
  toDate: "2021-01-03",
  toUserId: 1,
};

Object.assign(mockedService, {
  requests: {
    async getHostRequestMessages() {
      return Promise.resolve([message2, message1]);
    },
  },
});

export default {
  component: SurfingTab,
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
  title: "Messages/SurfingTab",
} as Meta;

const Template: Story<any> = (args) => {
  mockedService.requests.listHostRequests = async () => {
    if (args.failing) {
      throw new Error("An error happened!");
    }
    return { hostRequestsList: [hostRequest1], lastRequestId: 0, noMore: true };
  };
  return <SurfingTab type="all" />;
};

export const Tab = Template.bind({});
Tab.args = {};

export const Failing = Template.bind({});
Failing.args = { failing: true };
