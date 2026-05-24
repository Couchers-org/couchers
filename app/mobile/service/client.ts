import { Request, RpcError, StatusCode } from "grpc-web";
import { AuthPromiseClient } from "@/proto/auth_grpc_web_pb";
import { NotificationsPromiseClient } from "@/proto/notifications_grpc_web_pb";

import { getApiBaseUrl } from "@/config/urls";
import isGrpcError from "@/service/utils/isGrpcError";
import { applicationNameForUserAgent } from "@/utils/userAgent";

const IS_PROD =
  (process.env.NEXT_PUBLIC_COUCHERS_ENV ||
    process.env.EXPO_PUBLIC_COUCHERS_ENV)! === "prod";

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
      console.error("🔴 Using API URL:", getApiBaseUrl());
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

// Sets an explicit User-Agent on API requests. Without this, native requests
// go out with the platform HTTP stack's default UA (okhttp's "okhttp/4.12.0"
// on Android, CFNetwork/Darwin on iOS), making API traffic indistinguishable
// from generic clients.
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
  unaryInterceptors: [
    authInterceptor,
    timeoutInterceptor,
    userAgentInterceptor,
  ],
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
  /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};

function buildClients(url: string) {
  if (!IS_PROD) {
    console.log("🔧 Mobile API URL:", url);
    console.log("🔧 Environment:", process.env.EXPO_PUBLIC_COUCHERS_ENV);
  }
  return {
    auth: new AuthPromiseClient(url, null, opts),
    notifications: new NotificationsPromiseClient(url, null, opts),
  };
}

// Mutable so reconfigureApiClient() can re-point it after the persisted URL
// override is hydrated at startup. Callers reference client.auth/.notifications
// at call time, so they always see the latest clients.
const client = buildClients(getApiBaseUrl());

// Rebuilds the gRPC clients against the currently-resolved API URL. Call after
// hydrating the URL override at startup; the initial clients above are created
// at import time, before the override is read from storage.
export function reconfigureApiClient(): void {
  Object.assign(client, buildClients(getApiBaseUrl()));
}

if (!IS_PROD && typeof window !== "undefined") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});
  grpcWebTools([client.auth, client.notifications]);
}

export default client;
