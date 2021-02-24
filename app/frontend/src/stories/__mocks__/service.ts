import { service as originalService } from "../../service";
import messages from "../../test/fixtures/messages.json";
import users from "../../test/fixtures/users.json";
import getThreadRes from "../../text/fixtures/getThreadRes.json";
import groupChat from "../../text/fixtures/groupChat.json";

const userMap = new Map(users.map((user) => [user.userId, user]));

export const mockedService = ({
  user: {
    getUser: (id: string) => {
      const result = userMap.get(+id);
      return Promise.resolve(result);
    },
  },
  api: {
    listFriends: () => Promise.resolve([users[1].userId, users[2].userId]),
  },
  conversations: {
    listGroupChats: () =>
      Promise.resolve({ groupChatsList: [groupChat], noMore: true }),
    getGroupChatMessages: () => Promise.resolve([messages[0], messages[1]]),
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
