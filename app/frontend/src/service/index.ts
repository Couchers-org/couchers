import auth from "./auth";
import search from "./search";
import user from "./user";

export const service = {
  search,
  user,
  auth,
};

export type ServiceMap = Record<string, (...args: any[]) => Promise<any>>;

export function mockService(serviceMaps: Record<string, ServiceMap> = service) {
  for (const name in serviceMaps) {
    for (const serviceName in serviceMaps[name]) {
      serviceMaps[name][serviceName] = () => {
        console.warn(
          `Service method '${name}.${serviceName}' is called. You should probably mock it.`
        );
        return Promise.resolve();
      };
    }
  }
}
