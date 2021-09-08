import { Error as GrpcError } from "grpc-web";
import { AccountPromiseClient } from "proto/account_grpc_web_pb";
import { APIPromiseClient } from "proto/api_grpc_web_pb";
import { AuthPromiseClient } from "proto/auth_grpc_web_pb";
import { BugsPromiseClient } from "proto/bugs_grpc_web_pb";
import { CommunitiesPromiseClient } from "proto/communities_grpc_web_pb";
import { ConversationsPromiseClient } from "proto/conversations_grpc_web_pb";
import { DiscussionsPromiseClient } from "proto/discussions_grpc_web_pb";
import { DonationsPromiseClient } from "proto/donations_grpc_web_pb";
import { EventsPromiseClient } from "proto/events_grpc_web_pb";
import { GroupsPromiseClient } from "proto/groups_grpc_web_pb";
import { JailPromiseClient } from "proto/jail_grpc_web_pb";
import { PagesPromiseClient } from "proto/pages_grpc_web_pb";
import { ReferencesPromiseClient } from "proto/references_grpc_web_pb";
import { ReportingPromiseClient } from "proto/reporting_grpc_web_pb";
import { RequestsPromiseClient } from "proto/requests_grpc_web_pb";
import { ResourcesPromiseClient } from "proto/resources_grpc_web_pb";
import { SearchPromiseClient } from "proto/search_grpc_web_pb";
import { ThreadsPromiseClient } from "proto/threads_grpc_web_pb";
export declare const setUnauthenticatedErrorHandler: (f: (e: GrpcError) => Promise<void>) => void;
export declare class AuthInterceptor {
    intercept(request: any, invoker: (request: any) => any): Promise<any>;
}
declare const client: {
    account: AccountPromiseClient;
    api: APIPromiseClient;
    auth: AuthPromiseClient;
    bugs: BugsPromiseClient;
    communities: CommunitiesPromiseClient;
    conversations: ConversationsPromiseClient;
    discussions: DiscussionsPromiseClient;
    donations: DonationsPromiseClient;
    events: EventsPromiseClient;
    groups: GroupsPromiseClient;
    jail: JailPromiseClient;
    pages: PagesPromiseClient;
    references: ReferencesPromiseClient;
    reporting: ReportingPromiseClient;
    requests: RequestsPromiseClient;
    resources: ResourcesPromiseClient;
    search: SearchPromiseClient;
    threads: ThreadsPromiseClient;
};
export default client;
//# sourceMappingURL=client.d.ts.map