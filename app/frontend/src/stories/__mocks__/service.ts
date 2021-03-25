import { service as originalService } from "service/index";
import getThreadRes from "test/fixtures/getThreadRes.json";
import groupChat from "test/fixtures/groupChat.json";
import messages from "test/fixtures/messages.json";
import users from "test/fixtures/users.json";

const [user1, user2, user3, user4] = users;

const userMap = {
  "1": user1,
  "2": user2,
  "3": user3,
  "4": user4,
  funnycat: user1,
  funnyChicken: user4,
  funnydog: user2,
  funnykid: user3,
};

export const mockedService = ({
  account: {},
  api: {
    listFriends: () => Promise.resolve([users[1].userId, users[2].userId]),
  },
  conversations: {
    getGroupChat: () => Promise.resolve(groupChat),
    getGroupChatMessages: () => Promise.resolve([messages[0], messages[1]]),
    listGroupChats: () =>
      Promise.resolve({
        groupChatsList: [groupChat],
        noMore: true,
      }),
  },
  threads: {
    getThread: () => Promise.resolve(getThreadRes),
  },
  user: {
    getUser: (id: string) => {
      const result = userMap[id as keyof typeof userMap];
      return Promise.resolve(result);
    },
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
