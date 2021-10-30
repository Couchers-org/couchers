import { service as originalService } from "service/index";
import comments from "test/fixtures/comments.json";
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

const serviceStubs = Object.keys(originalService).reduce(
  (serviceStub: Record<string, unknown>, serviceKey) => {
    serviceStub[serviceKey] = {};
    return serviceStub;
  },
  {}
);

export const mockedService = {
  ...serviceStubs,
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
  resources: {
    getCommunityGuidelines: () =>
      Promise.resolve({
        communityGuidelinesList: [
          {
            title: "Guideline 1",
            guideline:
              "Follow guideline 1. Follow it very carefully. It is important.",
            iconSvg:
              '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="green" stroke-width="4" fill="yellow" /></svg>',
          },
          {
            title: "Guideline 2",
            guideline:
              "Follow guideline 2. Follow it very carefully. It is important.",
            iconSvg:
              '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="green" stroke-width="4" fill="yellow" /></svg>',
          },
        ],
      }),
  },
  threads: {
    getThread: () =>
      Promise.resolve({ nextPageToken: "", repliesList: comments.slice(0, 4) }),
  },
  user: {
    getUser: (id: string) => {
      const result = userMap[id as keyof typeof userMap];
      return Promise.resolve(result);
    },
  },
} as unknown as typeof originalService;

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
