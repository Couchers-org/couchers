import { service as originalService } from "../service";

export const mockedService = {} as typeof originalService;

export const service = new Proxy(
  {},
  {
    get(target: {}, name: PropertyKey): any {
      return new Proxy(
        {},
        {
          get(target: {}, serviceName: PropertyKey): any {

            const serviceMethod =
              (mockedService as any)[name] &&
              (mockedService as any)[name][serviceName];
            if (serviceMethod) {
              return async(...args:any[]) => {
                  console.log(
                      `Service method '${String(name)}.${String(
                          serviceName
                      )}' is called with args:`,...args
                  );
                  const result=await serviceMethod(...args)
                  console.log('Result: ', result)
                  return Promise.resolve(result);
              };
            } else
              return () => {
                console.warn(
                  `Service method '${String(name)}.${String(
                    serviceName
                  )}' is called. You should probably mock it.`
                );
                return Promise.resolve();
              };
          },
        }
      );
    },
  }
);
