import { service as originalService } from "..";
import { MessageProps } from "../../features/messages/messagelist/Message";
import { User } from "../../pb/api_pb";
import { Message } from "../../pb/conversations_pb";
import funnycat from "../../stories/assets/funnycat.jpg";
import funnydog from "../../stories/assets/funnydog.jpg";
import funnykid from "../../stories/assets/funnykid.jpg";

export const user1 = {
  name: "Funny Cat current User",
  userId: 1,
  username: "funnycat",
  avatarUrl: funnycat,
} as User.AsObject;

const user2 = {
  name: "Funny Dog",
  userId: 2,
  username: "funnydog",
  avatarUrl: funnydog,
} as User.AsObject;

const user3 = {
  name: "Funny Kid",
  userId: 3,
  username: "funnykid",
  avatarUrl: funnykid,
} as User.AsObject;

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
      Promise.resolve([
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
          latestMessage: message1,
        },
      ]),
    getGroupChatMessages: () => Promise.resolve([message1, message2]),
  },
} as unknown) as typeof originalService;

export const service = new Proxy(
  {},
  {
    get(target: Record<string, unknown>, serviceName: string): any {
      if (target[serviceName]) {
        return target[serviceName];
      }

      const proxy = new Proxy(
        {},
        {
          get(innerTarget: Record<string, unknown>, methodName: string): any {
            if (innerTarget[methodName]) {
              return innerTarget[methodName];
            }

            const serviceMethod = (mockedService as any)?.[serviceName]?.[
              methodName
            ];
            if (serviceMethod) {
              const decoratedMethod = async (...args: any[]) => {
                console.log(
                  `Service method '${String(serviceName)}.${String(
                    methodName
                  )}' is called with args:`,
                  ...args
                );
                const result = await serviceMethod(...args);
                return result;
              };

              const proxiedMockFn =
                process.env.NODE_ENV === "test"
                  ? jest.fn(decoratedMethod)
                  : decoratedMethod;
              innerTarget[methodName] = proxiedMockFn;

              return proxiedMockFn;
            }

            const emptyDecoratedMethod = () => {
              console.warn(
                `Service method '${serviceName}.${methodName}' is called without a mock implementation.
                You should probably provide one.`
              );
              return Promise.resolve();
            };
            const emptyMockFn =
              process.env.NODE_ENV === "test"
                ? jest.fn(emptyDecoratedMethod)
                : emptyDecoratedMethod;
            innerTarget[methodName] = emptyMockFn;

            return emptyMockFn;
          },
        }
      );
      target[serviceName] = proxy;
      return proxy;
    },
  }
);
