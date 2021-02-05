import { HostRequestStatus } from "../pb/conversations_pb";
import messages from "./fixtures/messages.json";
import users from "./fixtures/users.json";

const userMap = new Map(users.map((user) => [user.userId, user]));

export async function getUser(userId: string) {
  return userMap.get(+userId);
}

export async function listFriends() {
  const [, user2, user3] = users;
  return [user2.userId, user3.userId];
}

export async function getGroupChatMessages() {
  return messages;
}

export async function listGroupChats() {
  return {
    groupChatsList: [
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
        latestMessage: messages[0],
      },
    ],
    noMore: true,
  };
}

export async function listHostRequests() {
  return [
    {
      hostRequestId: 1,
      fromUserId: 1,
      toUserId: 2,
      status: HostRequestStatus.HOST_REQUEST_STATUS_PENDING,
      created: { seconds: Date.now() / 1000, nanos: 0 },
      fromDate: "2020/12/01",
      toDate: "2020/12/06",
      lastSeenMessageId: 0,
      latestMessage: messages[0],
    },
  ];
}
