import { Code, ConnectError, Interceptor } from "@connectrpc/connect";

// Backend sends "unauthenticated" response code both when unauthenticated and jailed,
// the message is used to distinguish the two. Keep in sync with backend!
const JAILED_ERROR_MESSAGE = "Permission denied";

export type UnauthenticatedCallback = (isJailed: boolean) => unknown;

export const createAuthInterceptor =
  (unauthenticatedCallback: UnauthenticatedCallback): Interceptor =>
  (next) =>
  async (req) => {
    try {
      return await next(req);
    } catch (e) {
      if (e instanceof ConnectError && e.code === Code.Unauthenticated) {
        unauthenticatedCallback(e.message === JAILED_ERROR_MESSAGE);
      }
      throw e;
    }
  };
