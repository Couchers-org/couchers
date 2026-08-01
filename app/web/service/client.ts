import { AccountPromiseClient } from "couchers/proto/account_grpc_web_pb";
import { AdminPromiseClient } from "couchers/proto/admin_grpc_web_pb";
import { APIPromiseClient } from "couchers/proto/api_grpc_web_pb";
import { AuthPromiseClient } from "couchers/proto/auth_grpc_web_pb";
import { BlockingPromiseClient } from "couchers/proto/blocking_grpc_web_pb";
import { BugsPromiseClient } from "couchers/proto/bugs_grpc_web_pb";
import { CommunitiesPromiseClient } from "couchers/proto/communities_grpc_web_pb";
import { ConversationsPromiseClient } from "couchers/proto/conversations_grpc_web_pb";
import { DiscussionsPromiseClient } from "couchers/proto/discussions_grpc_web_pb";
import { DonationsPromiseClient } from "couchers/proto/donations_grpc_web_pb";
import { EventsPromiseClient } from "couchers/proto/events_grpc_web_pb";
import { GalleriesPromiseClient } from "couchers/proto/galleries_grpc_web_pb";
import { GroupsPromiseClient } from "couchers/proto/groups_grpc_web_pb";
import { JailPromiseClient } from "couchers/proto/jail_grpc_web_pb";
import { NotificationsPromiseClient } from "couchers/proto/notifications_grpc_web_pb";
import { PagesPromiseClient } from "couchers/proto/pages_grpc_web_pb";
import { PublicPromiseClient } from "couchers/proto/public_grpc_web_pb";
import { PublicTripsPromiseClient } from "couchers/proto/public_trips_grpc_web_pb";
import { ReferencesPromiseClient } from "couchers/proto/references_grpc_web_pb";
import { ReportingPromiseClient } from "couchers/proto/reporting_grpc_web_pb";
import { RequestsPromiseClient } from "couchers/proto/requests_grpc_web_pb";
import { ResourcesPromiseClient } from "couchers/proto/resources_grpc_web_pb";
import { SearchPromiseClient } from "couchers/proto/search_grpc_web_pb";
import { ThreadsPromiseClient } from "couchers/proto/threads_grpc_web_pb";
import { Request, RpcError, StatusCode } from "grpc-web";
import { getClientPlatform } from "utils/clientPlatform";

import isGrpcError from "./utils/isGrpcError";

const URL = (process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL)!;
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

// Tells the backend which client platform a request came from (web desktop/mobile, iOS, Android),
// so it can attribute usage metrics.
class PlatformInterceptor {
  async intercept(
    request: Request<unknown, unknown>,
    invoker: (request: unknown) => unknown,
  ) {
    const platform = getClientPlatform();
    if (platform) {
      request.getMetadata()["x-couchers-client-platform"] = platform;
    }
    return invoker(request);
  }
}

const authInterceptor = new AuthInterceptor();
const timeoutInterceptor = new TimeoutInterceptor();
const platformInterceptor = new PlatformInterceptor();

const opts = {
  unaryInterceptors: [authInterceptor, timeoutInterceptor, platformInterceptor],
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
  /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};

const client = {
  account: new AccountPromiseClient(URL, null, opts),
  admin: new AdminPromiseClient(URL, null, opts),
  api: new APIPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL, null, opts),
  blocking: new BlockingPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  communities: new CommunitiesPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  discussions: new DiscussionsPromiseClient(URL, null, opts),
  donations: new DonationsPromiseClient(URL, null, opts),
  events: new EventsPromiseClient(URL, null, opts),
  galleries: new GalleriesPromiseClient(URL, null, opts),
  groups: new GroupsPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
  notifications: new NotificationsPromiseClient(URL, null, opts),
  pages: new PagesPromiseClient(URL, null, opts),
  public: new PublicPromiseClient(URL, null, opts),
  publicTrips: new PublicTripsPromiseClient(URL, null, opts),
  references: new ReferencesPromiseClient(URL, null, opts),
  reporting: new ReportingPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  resources: new ResourcesPromiseClient(URL, null, opts),
  search: new SearchPromiseClient(URL, null, opts),
  threads: new ThreadsPromiseClient(URL, null, opts),
};

if (!IS_PROD && typeof window !== "undefined") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

  grpcWebTools([
    client.account,
    client.admin,
    client.api,
    client.auth,
    client.blocking,
    client.bugs,
    client.communities,
    client.conversations,
    client.discussions,
    client.donations,
    client.events,
    client.galleries,
    client.groups,
    client.jail,
    client.notifications,
    client.pages,
    client.public,
    client.publicTrips,
    client.references,
    client.reporting,
    client.requests,
    client.resources,
    client.search,
    client.threads,
  ]);
}

export default client;
