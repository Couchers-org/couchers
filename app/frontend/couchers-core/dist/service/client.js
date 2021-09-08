var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { StatusCode } from "grpc-web";
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
import isGrpcError from "utils/isGrpcError";
import { grpcTimeout } from "./constants";
var URL = process.env.REACT_APP_API_BASE_URL;
var _unauthenticatedErrorHandler = function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/];
}); }); };
export var setUnauthenticatedErrorHandler = function (f) {
    _unauthenticatedErrorHandler = f;
};
var AuthInterceptor = /** @class */ (function () {
    function AuthInterceptor() {
    }
    AuthInterceptor.prototype.intercept = function (request, invoker) {
        return __awaiter(this, void 0, void 0, function () {
            var response, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, invoker(request)];
                    case 1:
                        response = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        if (isGrpcError(e_1) && e_1.code === StatusCode.UNAUTHENTICATED) {
                            _unauthenticatedErrorHandler(e_1);
                        }
                        else {
                            throw e_1;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, response];
                }
            });
        });
    };
    return AuthInterceptor;
}());
export { AuthInterceptor };
var TimeoutInterceptor = /** @class */ (function () {
    function TimeoutInterceptor() {
    }
    TimeoutInterceptor.prototype.intercept = function (request, invoker) {
        return __awaiter(this, void 0, void 0, function () {
            var deadline, metadata, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        deadline = Date.now() + grpcTimeout;
                        metadata = request.getMetadata();
                        metadata.deadline = deadline;
                        return [4 /*yield*/, invoker(request)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response];
                }
            });
        });
    };
    return TimeoutInterceptor;
}());
var authInterceptor = new AuthInterceptor();
var timeoutInterceptor = new TimeoutInterceptor();
var opts = {
    unaryInterceptors: [authInterceptor, timeoutInterceptor],
    // this modifies the behaviour on the API so that it will send cookies on the requests
    withCredentials: true,
    /// TODO: streaming interceptor for auth https://grpc.io/blog/grpc-web-interceptor/
};
var client = {
    account: new AccountPromiseClient(URL, null, opts),
    api: new APIPromiseClient(URL, null, opts),
    auth: new AuthPromiseClient(URL, null, opts),
    bugs: new BugsPromiseClient(URL, null, opts),
    communities: new CommunitiesPromiseClient(URL, null, opts),
    conversations: new ConversationsPromiseClient(URL, null, opts),
    discussions: new DiscussionsPromiseClient(URL, null, opts),
    donations: new DonationsPromiseClient(URL, null, opts),
    events: new EventsPromiseClient(URL, null, opts),
    groups: new GroupsPromiseClient(URL, null, opts),
    jail: new JailPromiseClient(URL, null, opts),
    pages: new PagesPromiseClient(URL, null, opts),
    references: new ReferencesPromiseClient(URL, null, opts),
    reporting: new ReportingPromiseClient(URL, null, opts),
    requests: new RequestsPromiseClient(URL, null, opts),
    resources: new ResourcesPromiseClient(URL, null, opts),
    search: new SearchPromiseClient(URL, null, opts),
    threads: new ThreadsPromiseClient(URL, null, opts),
};
if (process.env.REACT_APP_COUCHERS_ENV !== "prod") {
    // @ts-ignore
    var grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (function () { });
    grpcWebTools([
        client.account,
        client.api,
        client.auth,
        client.bugs,
        client.communities,
        client.conversations,
        client.discussions,
        client.donations,
        client.events,
        client.groups,
        client.jail,
        client.pages,
        client.references,
        client.reporting,
        client.requests,
        client.resources,
        client.search,
        client.threads,
    ]);
}
export default client;
//# sourceMappingURL=client.js.map