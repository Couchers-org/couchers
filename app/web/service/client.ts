import { AccountPromiseClient } from "@couchers/services/account_grpc_web";
import { AdminPromiseClient } from "@couchers/services/admin_grpc_web";
import { APIPromiseClient } from "@couchers/services/api_grpc_web";
import { AuthPromiseClient } from "@couchers/services/auth_grpc_web";
import { BlockingPromiseClient } from "@couchers/services/blocking_grpc_web";
import { BugsPromiseClient } from "@couchers/services/bugs_grpc_web";
import { CommunitiesPromiseClient } from "@couchers/services/communities_grpc_web";
import { ConversationsPromiseClient } from "@couchers/services/conversations_grpc_web";
import { DiscussionsPromiseClient } from "@couchers/services/discussions_grpc_web";
import { DonationsPromiseClient } from "@couchers/services/donations_grpc_web";
import { EventsPromiseClient } from "@couchers/services/events_grpc_web";
import { GroupsPromiseClient } from "@couchers/services/groups_grpc_web";
import { JailPromiseClient } from "@couchers/services/jail_grpc_web";
import { NotificationsPromiseClient } from "@couchers/services/notifications_grpc_web";
import { PagesPromiseClient } from "@couchers/services/pages_grpc_web";
import { PublicPromiseClient } from "@couchers/services/public_grpc_web";
import { ReferencesPromiseClient } from "@couchers/services/references_grpc_web";
import { ReportingPromiseClient } from "@couchers/services/reporting_grpc_web";
import { RequestsPromiseClient } from "@couchers/services/requests_grpc_web";
import { ResourcesPromiseClient } from "@couchers/services/resources_grpc_web";
import { SearchPromiseClient } from "@couchers/services/search_grpc_web";
import { ThreadsPromiseClient } from "@couchers/services/threads_grpc_web";
import { RpcError, StatusCode, UnaryInterceptor } from "grpc-web";

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

export const authInterceptor: UnaryInterceptor<unknown, unknown> = {
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

export const timeoutInterceptor: UnaryInterceptor<unknown, unknown> = {
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
