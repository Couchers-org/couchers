import { StatusCode } from "grpc-web";
import { APIPromiseClient } from "../pb/api_grpc_web_pb";
import { AuthPromiseClient } from "../pb/auth_grpc_web_pb";
import { BugsPromiseClient } from "../pb/bugs_grpc_web_pb";
import { ConversationsPromiseClient } from "../pb/conversations_grpc_web_pb";
import { JailPromiseClient } from "../pb/jail_grpc_web_pb";
import { RequestsPromiseClient } from "../pb/requests_grpc_web_pb";
import { SSOPromiseClient } from "../pb/sso_grpc_web_pb";

const URL = process.env.REACT_APP_API_BASE_URL;

let _unauthenticatedErrorHandler: () => Promise<void> = async () => {};
export const setUnauthenticatedErrorHandler = (f: () => Promise<void>) => {
  _unauthenticatedErrorHandler = f;
};

class AuthInterceptor {
  async intercept(request: any, invoker: (request: any) => any) {
    let response;
    try {
      response = await invoker(request);
    } catch (e) {
      if (e.code === StatusCode.UNAUTHENTICATED) {
        _unauthenticatedErrorHandler();
      } else {
        throw e;
      }
    }
    return response;
  }
}

const interceptor = new AuthInterceptor();

const opts = {
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
  unaryInterceptors: [interceptor],
  /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};

const apis = {
  api: new APIPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  sso: new SSOPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
};

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

  grpcWebTools([
    apis.api,
    apis.bugs,
    apis.sso,
    apis.conversations,
    apis.auth,
    apis.requests,
    apis.jail,
  ]);
}

export default apis;
