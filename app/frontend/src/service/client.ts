import { APIPromiseClient } from "../pb/api_grpc_web_pb";
import { AuthPromiseClient } from "../pb/auth_grpc_web_pb";
import { BugsPromiseClient } from "../pb/bugs_grpc_web_pb";
import { ConversationsPromiseClient } from "../pb/conversations_grpc_web_pb";
import { GISPromiseClient } from "../pb/gis_grpc_web_pb";
import { JailPromiseClient } from "../pb/jail_grpc_web_pb";
import { RequestsPromiseClient } from "../pb/requests_grpc_web_pb";
import { SSOPromiseClient } from "../pb/sso_grpc_web_pb";

const URL = process.env.REACT_APP_API_BASE_URL;

const opts = {
  // this modifies the behaviour on the API so that it will send cookies on the requests
  withCredentials: true,
};

const apis = {
  api: new APIPromiseClient(URL, null, opts),
  auth: new AuthPromiseClient(URL, null, opts),
  bugs: new BugsPromiseClient(URL, null, opts),
  conversations: new ConversationsPromiseClient(URL, null, opts),
  gis: new GISPromiseClient(URL, null, opts),
  jail: new JailPromiseClient(URL, null, opts),
  requests: new RequestsPromiseClient(URL, null, opts),
  sso: new SSOPromiseClient(URL, null, opts),
};

if (process.env.NODE_ENV === "development") {
  // @ts-ignore
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

  grpcWebTools([
    apis.api,
    apis.auth,
    apis.bugs,
    apis.conversations,
    apis.gis,
    apis.jail,
    apis.requests,
    apis.sso,
  ]);
}

export default apis;
