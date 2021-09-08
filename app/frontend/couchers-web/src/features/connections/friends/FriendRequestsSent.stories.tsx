import { Meta, Story } from "@storybook/react";
import { FriendRequest } from "couchers-core/src/proto/api_pb";
import FriendRequestsSent from "features/connections/friends/FriendRequestsSent";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import React, { useRef } from "react";
import { mockedService } from "stories/serviceMocks";

export default {
  component: FriendRequestsSent,
  title: "Me/Connections/FriendRequestsSent",
} as Meta;

interface FriendRequestsState {
  sentList: FriendRequest.AsObject[];
  receivedList: FriendRequest.AsObject[];
}

interface MockOverrides {
  listFriendRequests?: () => Promise<FriendRequestsState>;
  cancelFriendRequest?: () => Promise<Empty>;
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
      <FriendRequestsSent />
    </div>
  );
};

export const WithPendingRequests = Template.bind({});
WithPendingRequests.args = {
  friendRequests: {
    receivedList: [],
    sentList: [
      {
        friendRequestId: 1,
        state: FriendRequest.FriendRequestStatus.PENDING,
        userId: 3,
        sent: true,
      },
    ],
  },
};

export const ErrorCancellingRequest = Template.bind({});
ErrorCancellingRequest.args = {
  friendRequests: {
    receivedList: [],
    sentList: [
      {
        friendRequestId: 1,
        state: FriendRequest.FriendRequestStatus.PENDING,
        userId: 3,
        sent: true,
      },
    ],
  },
  overrides: {
    cancelFriendRequest: async () => {
      throw new Error("Can't cancel friend request...");
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
  mockedService.api.cancelFriendRequest =
    overrides.cancelFriendRequest ??
    (async () => {
      friendRequests.current = { receivedList: [], sentList: [] };
      return new Empty();
    });
}
