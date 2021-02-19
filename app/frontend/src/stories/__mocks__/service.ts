import { MessageProps } from "../../features/messages/messagelist/MessageView";
import { HostingStatus, User } from "../../pb/api_pb";
import { HostRequestStatus, Message } from "../../pb/conversations_pb";
import { service as originalService } from "../../service";
import funnycat from "../assets/funnycat.jpg";
import funnydog from "../assets/funnydog.jpg";
import funnykid from "../assets/funnykid.jpg";

export const user1 = {
  name: "Funny Cat current User",
  userId: 1,
  username: "funnycat",
  avatarUrl: funnycat,
  age: 28,
  city: "Los Angeles",
  hostingStatus: HostingStatus.HOSTING_STATUS_CAN_HOST,
  communityStanding: 0.5,
  verification: 0.5,
  aboutMe: "I am a user",
} as User.AsObject;

const user2 = {
  ...user1,
  name: "Funny Dog",
  userId: 2,
  username: "funnydog",
  avatarUrl: funnydog,
} as User.AsObject;

const user3 = {
  ...user1,
  name: "Funny Kid",
  userId: 3,
  username: "funnykid",
  avatarUrl: funnykid,
} as User.AsObject;

const userMap = new Map(
  [user1, user2, user3].map((user) => [user.userId, user])
);

export const mockedService = ({
  user: {
    getUser: (id: string) => {
      const result = userMap.get(+id);
      return Promise.resolve(result);
    },
  },
  api: { listFriends: () => Promise.resolve([user2.userId, user3.userId]) },
  conversations: {
    listGroupChats: () =>
      Promise.resolve({ groupChatsList: [groupChat], noMore: true }),
    getGroupChatMessages: () => Promise.resolve([message1, message2]),
    getGroupChat: () => Promise.resolve(groupChat),
  },
} as unknown) as typeof originalService;

function wait(milliSeconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds));
}

export const service = new Proxy(
  {},
  {
    get(target: {}, serviceName: PropertyKey): any {
      return new Proxy(
        {},
        {
          get(target: {}, methodName: PropertyKey): any {
            const serviceMethod =
              (mockedService as any)[serviceName] &&
              (mockedService as any)[serviceName][methodName];
            if (serviceMethod) {
              return async (...args: any[]) => {
                console.log(
                  `Service method '${String(serviceName)}.${String(
                    methodName
                  )}' is called with args:`,
                  ...args
                );
                await wait(1e3);
                const result = await serviceMethod(...args);
                console.log("Result: ", result);
                return Promise.resolve(result);
              };
            } else {
              return () => {
                console.warn(
                  `Service method '${String(serviceName)}.${String(
                    methodName
                  )}' is called. You should probably mock it.`
                );
                return Promise.resolve();
              };
            }
          },
        }
      );
    },
  }
);

export const message1: MessageProps["message"] = {
  messageId: 1,
  authorUserId: 2,
  text: { text: "testtext" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
} as Message.AsObject;
const message2: MessageProps["message"] = {
  messageId: 2,
  authorUserId: 2,
  text: { text: "testtext" },
  time: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
};

export const groupChat = {
  groupChatId: 3,
  title: "Group chat title",
  memberUserIdsList: [1, 2],
  adminUserIdsList: [1],
  onlyAdminsInvite: true,
  isDm: false,
  // created?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  unseenMessageCount: 0,
  lastSeenMessageId: 4,
  latestMessage: message1,
};

export const hostRequest = {
  hostRequestId: 1,
  fromUserId: 1,
  toUserId: 2,
  status: HostRequestStatus.HOST_REQUEST_STATUS_ACCEPTED,
  created: { seconds: Math.floor(+new Date(2020, 0, 1) / 1e3), nanos: 0 },
  fromDate: "2025-01-01",
  toDate: "2025-01-05",
  lastSeenMessageId: 0,
  latestMessage: message1,
};
