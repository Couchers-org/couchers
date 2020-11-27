import { User } from "../pb/api_pb";
import { service as originalService } from "../service";
import funnycat from "../stories/assets/funnycat.jpg";
import funnydog from "../stories/assets/funnydog.jpg";
import funnykid from "../stories/assets/funnykid.jpg";

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

const userMap = new Map(
  [user1, user2, user3].map((user) => [user.userId, user])
);

export const mockedService = {
  user: {
    getUser: (id: string) => {
      const result = userMap.get(+id);
      return Promise.resolve(result);
    },
  },
  api: { listFriends: () => Promise.resolve([user2.userId, user3.userId]) },
} as typeof originalService;

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
