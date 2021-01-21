import { Meta, Story } from "@storybook/react/types-6-0";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React, { useRef } from "react";
import { mockedService } from "../../../stories/__mocks__/service";
import { FriendRequest } from "../../../pb/api_pb";
import FriendRequestsReceived from "./FriendRequestsReceived";

export default {
  title: "FriendRequestsReceived",
  component: FriendRequestsReceived,
} as Meta;

interface FriendRequestsState {
  sentList: FriendRequest.AsObject[];
  receivedList: FriendRequest.AsObject[];
}

interface MockOverrides {
  listFriendRequests?: () => Promise<FriendRequestsState>;
  respondFriendRequest?: () => Promise<Empty>;
}

const Template: Story<{
  friendRequests: FriendRequestsState;
  overrides?: MockOverrides;
}> = ({ friendRequests, overrides }) => {
  const friendRequestsRef = useRef<{
    sentList: FriendRequest.AsObject[];
    receivedList: FriendRequest.AsObject[];
  }>(friendRequests);

  setFriendRequestsMocks(friendRequestsRef, overrides);

  return (
    <div style={{ width: "50%" }}>
      <FriendRequestsReceived />
    </div>
  );
};

export const WithPendingRequests = Template.bind({});
WithPendingRequests.args = {
  friendRequests: {
    sentList: [],
    receivedList: [
      {
        friendRequestId: 1,
        state: FriendRequest.FriendRequestStatus.PENDING,
        userId: 3,
      },
    ],
  },
};

export const ErrorRespondingToRequest = Template.bind({});
ErrorRespondingToRequest.args = {
  friendRequests: {
    sentList: [],
    receivedList: [
      {
        friendRequestId: 1,
        state: FriendRequest.FriendRequestStatus.PENDING,
        userId: 3,
      },
    ],
  },
  overrides: {
    respondFriendRequest: async () => {
      throw new Error("Can't respond to friend request...");
    },
  },
};

function setFriendRequestsMocks(
  friendRequests: React.MutableRefObject<{
    sentList: FriendRequest.AsObject[];
    receivedList: FriendRequest.AsObject[];
  }>,
  overrides: any = {}
) {
  mockedService.api.listFriendRequests = async () => friendRequests.current;
  mockedService.api.respondFriendRequest =
    overrides.respondFriendRequest ??
    (async () => {
      friendRequests.current = { sentList: [], receivedList: [] };
      return new Empty();
    });
}
