import { APIPromiseClient } from "../pb/api_grpc_web_pb";
import { AuthPromiseClient } from "../pb/auth_grpc_web_pb";
import { BugsPromiseClient } from "../pb/bugs_grpc_web_pb";
import { ConversationsPromiseClient } from "../pb/conversations_grpc_web_pb";
import { RequestsPromiseClient } from "../pb/requests_grpc_web_pb";
import { SSOPromiseClient } from "../pb/sso_grpc_web_pb";
import { store } from "../store";

const URL = process.env.REACT_APP_API_BASE_URL;

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

const apis = {
  // @ts-ignore
  api: new APIPromiseClient(URL, null, opts),
  // @ts-ignore
  bugs: new BugsPromiseClient(URL, null, opts),
  // @ts-ignore
  sso: new SSOPromiseClient(URL, null, opts),
  // @ts-ignore
  conversations: new ConversationsPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL),
  // @ts-ignore
  requests: new RequestsPromiseClient(URL, null, opts),
};

export default apis;
