import { Request, RpcError, StatusCode } from "grpc-web";
import { AuthPromiseClient } from "@/proto/auth_grpc_web_pb";
import { NotificationsPromiseClient } from "@/proto/notifications_grpc_web_pb";

import isGrpcError from "@/service/utils/isGrpcError";
import { applicationNameForUserAgent } from "@/utils/userAgent";

const URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:8888"; // fallback for tests
const IS_PROD =
  (process.env.NEXT_PUBLIC_COUCHERS_ENV ||
    process.env.EXPO_PUBLIC_COUCHERS_ENV)! === "prod";

// Debug: Log the API URL being used
if (!IS_PROD) {
  console.log("🔧 Mobile API URL:", URL);
  console.log("🔧 Environment:", process.env.EXPO_PUBLIC_COUCHERS_ENV);
}

const grpcTimeout = 10000; //milliseconds

let _unauthenticatedErrorHandler: (
  e: RpcError,
) => Promise<void> = async () => {};
export const setUnauthenticatedErrorHandler = (
  f: (e: RpcError) => Promise<void>,
) => {
  _unauthenticatedErrorHandler = f;
};

export class AuthInterceptor {
  async intercept(request: unknown, invoker: (request: unknown) => unknown) {
    let response;
    try {
      response = await invoker(request);
    } catch (e) {
      console.error("🔴 API Request Error:", e);
      console.error("🔴 Using API URL:", URL);
      if (isGrpcError(e) && e.code === StatusCode.UNAUTHENTICATED) {
        _unauthenticatedErrorHandler(e);
      } else {
        throw e;
      }
    }
    return response;
  }
}

class TimeoutInterceptor {
  async intercept(
    request: Request<unknown, unknown>,
    invoker: (request: unknown) => unknown,
  ) {
    const deadline = Date.now() + grpcTimeout;
    const metadata = request.getMetadata();
    metadata.deadline = deadline.toString();
    const response = await invoker(request);
    return response;
  }
}

// Sets an explicit User-Agent on API requests. Without this, React Native's
// networking layer falls back to okhttp's default ("okhttp/4.12.0"), which
// makes Android API traffic indistinguishable from generic clients.
export class UserAgentInterceptor {
  async intercept(
    request: Request<unknown, unknown>,
    invoker: (request: unknown) => unknown,
  ) {
    request.getMetadata()["User-Agent"] = applicationNameForUserAgent;
    return invoker(request);
  }
}

const authInterceptor = new AuthInterceptor();
const timeoutInterceptor = new TimeoutInterceptor();
const userAgentInterceptor = new UserAgentInterceptor();

const opts = {
  unaryInterceptors: [authInterceptor, timeoutInterceptor, userAgentInterceptor],
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
  /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};

const client = {
  auth: new AuthPromiseClient(URL, null, opts),
  notifications: new NotificationsPromiseClient(URL, null, opts),
};

if (!IS_PROD && typeof window !== "undefined") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});
  grpcWebTools([client.auth, client.notifications]);
}

export default client;
