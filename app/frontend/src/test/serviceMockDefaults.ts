import { User } from "pb/api_pb";
import { HostRequestStatus } from "pb/conversations_pb";
import comments from "test/fixtures/comments.json";
import messages from "test/fixtures/messages.json";
import users from "test/fixtures/users.json";

const [user1, user2, user3, user4] = users;

const userMap: Record<string, User.AsObject> = {
  "1": user1,
  "2": user2,
  "3": user3,
  "4": user4,
  funnycat: user1,
  funnyChicken: user4,
  funnydog: user2,
  funnykid: user3,
};

export async function getUser(userId: string): Promise<User.AsObject> {
  return userMap[userId];
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

export async function getThread(threadId: number) {
  switch (threadId) {
    case 2:
      return {
        nextPageToken: "",
        repliesList: comments.slice(0, 4),
      };
    case 3:
    case 4:
    case 5:
    case 6:
      return {
        nextPageToken: "",
        repliesList: [
          {
            threadId: threadId * 3,
            content: `+${threadId}`,
            authorUserId: 3,
            createdTime: { seconds: 1577920000, nanos: 0 },
            numReplies: 0,
          },
        ],
      };
    default:
      return { nextPageToken: "", repliesList: [] };
  }
}
