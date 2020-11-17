import { APIPromiseClient } from "../pb/api_grpc_web_pb";
import { AuthPromiseClient } from "../pb/auth_grpc_web_pb";
import { BugsPromiseClient } from "../pb/bugs_grpc_web_pb";
import { ConversationsPromiseClient } from "../pb/conversations_grpc_web_pb";
import { RequestsPromiseClient } from "../pb/requests_grpc_web_pb";

import { store } from "../store";

const URL = "http://localhost:8888";

class AuthInterceptor {
  intercept(request: any, invoker: (request: any) => any) {
    const authorizationHeader = request.getMetadata().authorization;

    if (!authorizationHeader) {
      const { authToken } = store.getState().auth;
      request.getMetadata().authorization = `Bearer ${authToken}`;
    }
    return invoker(request);
  }
}

const interceptor = new AuthInterceptor();

const opts = {
  unaryInterceptors: [interceptor],
  streamInterceptors: [interceptor],
};

export const client = {
  api: new APIPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  sso: new BugsPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL),
  requests: new RequestsPromiseClient(URL, null, opts),
};
