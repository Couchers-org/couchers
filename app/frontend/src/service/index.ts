import auth from "./auth";
import search from "./search";
import user from "./user";

export const service = {
  search,
  user,
  auth,
} as const;

export type ServiceMap = Record<string, (...args: any[]) => Promise<any>>;

export function mockService() {
  let name: keyof typeof service;
  for (name in service) {
    const serviceMap = service[name];
    for (const serviceName in serviceMap) {
      (serviceMap as any)[serviceName] = () => {
        console.warn(
          `Service method '${name}.${serviceName}' is called. You should probably mock it.`
        );
        return Promise.resolve();
      };
    }
  }
}
