import { HostRequestStatus } from "pb/conversations_pb";
import messages from "test/fixtures/messages.json";
import users from "test/fixtures/users.json";

const userMap = new Map(users.map((user) => [user.userId, user]));

export async function getUser(userId: string) {
  return userMap.get(+userId);
}

export async function listFriends() {
  const [, user2, user3] = users;
  return [user2.userId, user3.userId];
}

export async function getGroupChatMessages() {
  return {
    lastMessageId: 5,
    messagesList: messages,
    noMore: true,
  };
}

export async function listGroupChats() {
  return {
    groupChatsList: [
      {
        adminUserIdsList: [],
        groupChatId: 3,
        isDm: false,
        lastSeenMessageId: 4,
        latestMessage: messages[0],
        memberUserIdsList: [],
        onlyAdminsInvite: true,
        title: "groupchattitle",
        // created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
        unseenMessageCount: 0,
      },
    ],
    noMore: true,
  };
}

export async function listHostRequests() {
  return [
    {
      created: {
        nanos: 0,
        seconds: Date.now() / 1000,
      },
      fromDate: "2020/12/01",
      fromUserId: 1,
      hostRequestId: 1,
      lastSeenMessageId: 0,
      latestMessage: messages[0],
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
      toDate: "2020/12/06",
      toUserId: 2,
    },
  ];
}
