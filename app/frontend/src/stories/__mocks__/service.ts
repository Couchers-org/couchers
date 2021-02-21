import { MessageProps } from "../../features/messages/messagelist/MessageView";
import { HostingStatus, User } from "../../pb/api_pb";
import { HostRequestStatus, Message } from "../../pb/conversations_pb";
import { PageType } from "../../pb/pages_pb";
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
  threads: {
    getThread: () => Promise.resolve(getThreadRes),
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

export const community = {
  community_id: 2,
  name: "Amsterdam",
  // a short URL fragment generated from the name, e.g. New York City: a guide to Phở might become new-york-city-guide-to-pho
  slug: "amsterdam",
  description: "This is amsterdam",
  created: { seconds: Date.now() / 1000, nanos: 0 },
  // list of parents, ordered according to inclusion, e.g. World, US, New York, (NYC)
  parents: 1,
  // we do not return the geometry here? (it's a potentially very big multipolygon)
  mainPage: {},
  // whether the requesting user is member/admin
  member: true,
  admin: false,
  memberCount: 5,
  adminCount: 2,
  nearbyUserCount: 3,
};

export const place = {
  pageId: 3,
  type: PageType.PAGE_TYPE_PLACE,
  slug: "concertgebouw",
  created: { seconds: Date.now() / 1000, nanos: 0 },
  lastEdited: { seconds: Date.now() / 1000, nanos: 0 },
  lastEditorUserId: 2,
  creatorUserId: 2,
  ownerCommunityId: 2,
  threadId: 2,
  title: "Concertgebouw",
  content:
    "# Concerts!\nThis famous playhouse is one of the leading concert halls in Europe",
  address: "Concertgebouwplein 10, 1071 LN Amsterdam, Netherlands",
  location: { lat: 52.35623800180904, lng: 4.878839154826316 },
  editorUserIdsList: [2],
  canEdit: false,
};

export const discussion = {
  discussionId: 1,
  slug: "what-is-there-to-do-in-amsterdam",
  created: { seconds: Date.now() / 1000, nanos: 0 },
  creatorUserId: 1,
  ownerCommunityId: 1,
  title: "What is there to do in Amsterdam?",
  content: "# Hi everyone,\nI'm looking for *fun* activities to do here!",
  threadId: 2,
};

const getThreadRes = {
  repliesList: [
    {
      threadId: 3,
      content: "Very interesting!",
      authorUserId: 2,
      createdTime: { seconds: Date.now() / 1000, nanos: 0 },
      numReplies: 1,
    },
    {
      threadId: 4,
      content: "Thanks so much (:",
      authorUserId: 1,
      createdTime: { seconds: Date.now() / 1000, nanos: 0 },
      numReplies: 0,
    },
    {
      threadId: 5,
      content:
        "You're welcome, by the way, check out my other favourite place.",
      authorUserId: 1,
      createdTime: { seconds: Date.now() / 1000, nanos: 0 },
      numReplies: 0,
    },
    {
      threadId: 6,
      content: "Sure, I will do that.",
      authorUserId: 1,
      createdTime: { seconds: Date.now() / 1000, nanos: 0 },
      numReplies: 0,
    },
  ],
};
