import { RpcError, StatusCode, UnaryInterceptor } from "grpc-web";

import { AccountPromiseClient } from "@/proto/account_grpc_web_pb";
import { AdminPromiseClient } from "@/proto/admin_grpc_web_pb";
import { APIPromiseClient } from "@/proto/api_grpc_web_pb";
import { AuthPromiseClient } from "@/proto/auth_grpc_web_pb";
import { BlockingPromiseClient } from "@/proto/blocking_grpc_web_pb";
import { BugsPromiseClient } from "@/proto/bugs_grpc_web_pb";
import { CommunitiesPromiseClient } from "@/proto/communities_grpc_web_pb";
import { ConversationsPromiseClient } from "@/proto/conversations_grpc_web_pb";
import { DiscussionsPromiseClient } from "@/proto/discussions_grpc_web_pb";
import { DonationsPromiseClient } from "@/proto/donations_grpc_web_pb";
import { EventsPromiseClient } from "@/proto/events_grpc_web_pb";
import { GroupsPromiseClient } from "@/proto/groups_grpc_web_pb";
import { JailPromiseClient } from "@/proto/jail_grpc_web_pb";
import { NotificationsPromiseClient } from "@/proto/notifications_grpc_web_pb";
import { PagesPromiseClient } from "@/proto/pages_grpc_web_pb";
import { PublicPromiseClient } from "@/proto/public_grpc_web_pb";
import { ReferencesPromiseClient } from "@/proto/references_grpc_web_pb";
import { ReportingPromiseClient } from "@/proto/reporting_grpc_web_pb";
import { RequestsPromiseClient } from "@/proto/requests_grpc_web_pb";
import { ResourcesPromiseClient } from "@/proto/resources_grpc_web_pb";
import { SearchPromiseClient } from "@/proto/search_grpc_web_pb";
import { ThreadsPromiseClient } from "@/proto/threads_grpc_web_pb";

import isGrpcError from "./utils/isGrpcError";

const URL = Config.apiBaseUrl;
const isProd = Config.couchersEnv === "prod";

export const GRPC_TIMEOUT = 10000; // milliseconds

let unauthenticatedErrorHandler: ((e: RpcError) => Promise<void>) | undefined;

export const setUnauthenticatedErrorHandler = (
  f: (e: RpcError) => Promise<void>,
) => {
  unauthenticatedErrorHandler = f;
};

const authInterceptor: UnaryInterceptor<unknown, unknown> = {
  intercept: async (request, invoker) => {
    try {
      return await invoker(request);
    } catch (e) {
      if (isGrpcError(e) && e.code === StatusCode.UNAUTHENTICATED) {
        await unauthenticatedErrorHandler?.(e);
      }
      throw e;
    }
  },
};

const timeoutInterceptor: UnaryInterceptor<unknown, unknown> = {
  intercept: async (request, invoker) => {
    const deadline = Date.now() + GRPC_TIMEOUT;
    const metadata = request.getMetadata();
    metadata.deadline = deadline.toString();
    const response = await invoker(request);
    return response;
  },
};

const opts = {
  unaryInterceptors: [authInterceptor, timeoutInterceptor],
  // this modifies the behavior on the API so that it will send cookies on the requests
  withCredentials: true,
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
  groups: new GroupsPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
  notifications: new NotificationsPromiseClient(URL, null, opts),
  pages: new PagesPromiseClient(URL, null, opts),
  public: new PublicPromiseClient(URL, null, opts),
  references: new ReferencesPromiseClient(URL, null, opts),
  reporting: new ReportingPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  resources: new ResourcesPromiseClient(URL, null, opts),
  search: new SearchPromiseClient(URL, null, opts),
  threads: new ThreadsPromiseClient(URL, null, opts),
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __GRPCWEB_DEVTOOLS__: ((params: unknown[]) => void) | undefined;
  }
}

if (!isProd && typeof window !== "undefined") {
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__;
  grpcWebTools?.(Object.values(client));
}

export default client;
