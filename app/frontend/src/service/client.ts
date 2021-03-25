import { StatusCode } from "grpc-web";
import { AccountPromiseClient } from "pb/account_grpc_web_pb";
import { APIPromiseClient } from "pb/api_grpc_web_pb";
import { AuthPromiseClient } from "pb/auth_grpc_web_pb";
import { BugsPromiseClient } from "pb/bugs_grpc_web_pb";
import { CommunitiesPromiseClient } from "pb/communities_grpc_web_pb";
import { ConversationsPromiseClient } from "pb/conversations_grpc_web_pb";
import { DiscussionsPromiseClient } from "pb/discussions_grpc_web_pb";
import { GroupsPromiseClient } from "pb/groups_grpc_web_pb";
import { JailPromiseClient } from "pb/jail_grpc_web_pb";
import { PagesPromiseClient } from "pb/pages_grpc_web_pb";
import { RequestsPromiseClient } from "pb/requests_grpc_web_pb";
import { SearchPromiseClient } from "pb/search_grpc_web_pb";
import { SSOPromiseClient } from "pb/sso_grpc_web_pb";
import { ThreadsPromiseClient } from "pb/threads_grpc_web_pb";

import { grpcTimeout } from "../constants";

const URL = process.env.REACT_APP_API_BASE_URL;

let _unauthenticatedErrorHandler: () => Promise<void> = async () => {};
export const setUnauthenticatedErrorHandler = (f: () => Promise<void>) => {
  _unauthenticatedErrorHandler = f;
};

export class AuthInterceptor {
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

class TimeoutInterceptor {
  async intercept(request: any, invoker: (request: any) => any) {
    const deadline = Date.now() + grpcTimeout;
    const metadata = request.getMetadata();
    metadata.deadline = deadline;
    const response = await invoker(request);
    return response;
  }
}

const authInterceptor = new AuthInterceptor();
const timeoutInterceptor = new TimeoutInterceptor();

const opts = {
  unaryInterceptors: [authInterceptor, timeoutInterceptor],
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
  /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};

const apis = {
  account: new AccountPromiseClient(URL, null, opts),
  api: new APIPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  communities: new CommunitiesPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  discussions: new DiscussionsPromiseClient(URL, null, opts),
  groups: new GroupsPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
  pages: new PagesPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  search: new SearchPromiseClient(URL, null, opts),
  sso: new SSOPromiseClient(URL, null, opts),
  threads: new ThreadsPromiseClient(URL, null, opts),
};

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

  grpcWebTools([
    apis.account,
    apis.api,
    apis.auth,
    apis.bugs,
    apis.communities,
    apis.conversations,
    apis.discussions,
    apis.groups,
    apis.jail,
    apis.pages,
    apis.requests,
    apis.search,
    apis.sso,
    apis.threads,
  ]);
}

export default apis;
