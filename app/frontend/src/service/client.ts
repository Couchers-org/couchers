import { StatusCode } from "grpc-web";
import { AccountPromiseClient } from "proto/account_grpc_web_pb";
import { APIPromiseClient } from "proto/api_grpc_web_pb";
import { AuthPromiseClient } from "proto/auth_grpc_web_pb";
import { BugsPromiseClient } from "proto/bugs_grpc_web_pb";
import { CommunitiesPromiseClient } from "proto/communities_grpc_web_pb";
import { ConversationsPromiseClient } from "proto/conversations_grpc_web_pb";
import { DiscussionsPromiseClient } from "proto/discussions_grpc_web_pb";
import { EventsPromiseClient } from "proto/events_grpc_web_pb";
import { GroupsPromiseClient } from "proto/groups_grpc_web_pb";
import { JailPromiseClient } from "proto/jail_grpc_web_pb";
import { PagesPromiseClient } from "proto/pages_grpc_web_pb";
import { ReferencesPromiseClient } from "proto/references_grpc_web_pb";
import { RequestsPromiseClient } from "proto/requests_grpc_web_pb";
import { ResourcesPromiseClient } from "proto/resources_grpc_web_pb";
import { SearchPromiseClient } from "proto/search_grpc_web_pb";
import { ThreadsPromiseClient } from "proto/threads_grpc_web_pb";

import { grpcTimeout } from "../constants";

const URL = process.env.REACT_APP_API_BASE_URL;

let _unauthenticatedErrorHandler: (e: Error) => Promise<void> = async () => {};
export const setUnauthenticatedErrorHandler = (
  f: (e: Error) => Promise<void>
) => {
  _unauthenticatedErrorHandler = f;
};

export class AuthInterceptor {
  async intercept(request: any, invoker: (request: any) => any) {
    let response;
    try {
      response = await invoker(request);
    } catch (e) {
      if (e.code === StatusCode.UNAUTHENTICATED) {
        _unauthenticatedErrorHandler(e);
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

const client = {
  account: new AccountPromiseClient(URL, null, opts),
  api: new APIPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  communities: new CommunitiesPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  discussions: new DiscussionsPromiseClient(URL, null, opts),
  events: new EventsPromiseClient(URL, null, opts),
  groups: new GroupsPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
  pages: new PagesPromiseClient(URL, null, opts),
  references: new ReferencesPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  resources: new ResourcesPromiseClient(URL, null, opts),
  search: new SearchPromiseClient(URL, null, opts),
  threads: new ThreadsPromiseClient(URL, null, opts),
};

if (process.env.REACT_APP_COUCHERS_ENV !== "prod") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

  grpcWebTools([
    client.account,
    client.api,
    client.auth,
    client.bugs,
    client.communities,
    client.conversations,
    client.discussions,
    client.events,
    client.groups,
    client.jail,
    client.pages,
    client.references,
    client.requests,
    client.resources,
    client.search,
    client.threads,
  ]);
}

export default client;
