import { service as originalService } from "..";
import { User } from "../../pb/api_pb";
import funnycat from "../../stories/assets/funnycat.jpg";
import funnydog from "../../stories/assets/funnydog.jpg";
import funnykid from "../../stories/assets/funnykid.jpg";
import messages from "../../test/fixtures/messages.json";
import users from "../../test/fixtures/users.json";

export const user1 = {
  ...users[0],
  avatarUrl: funnycat,
} as User.AsObject;

const user2 = {
  ...users[1],
  avatarUrl: funnydog,
} as User.AsObject;

const user3 = {
  ...users[2],
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
          latestMessage: messages[0],
        },
      ]),
    getGroupChatMessages: () => Promise.resolve(messages),
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
              const proxiedMockFn = jest.fn((...args: any[]) => {
                return serviceMethod(...args);
              });
              innerTarget[methodName] = proxiedMockFn;

              return proxiedMockFn;
            }

            const emptyMockFn = jest.fn(() => {
              console.warn(
                `Service method '${serviceName}.${methodName}' is called without a mock implementation.
                You should probably provide one.`
              );
              return Promise.resolve();
            });
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
