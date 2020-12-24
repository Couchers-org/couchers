import messages from "./fixtures/messages.json";
import users from "./fixtures/users.json";

const [user1, user2, user3] = users;

const userMap = new Map(
  [user1, user2, user3].map((user) => [user.userId, user])
);

export async function getUser(userId: string) {
  return userMap.get(+userId);
}

export async function listFriends() {
  return [user2.userId, user3.userId];
}

export async function getGroupChatMessages() {
  return messages;
}

export async function listGroupChats() {
  return [
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
  ];
}
