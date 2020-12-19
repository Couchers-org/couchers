export const URL = process.env.VUE_APP_API_URL

export const ACCESS_TOKEN = process.env.VUE_APP_ACCESS_TOKEN

export const NOMINATIM_URL = process.env.VUE_APP_NOMINATIM_URL

import { AuthPromiseClient } from "./pb/auth_grpc_web_pb"
import { JailPromiseClient } from "./pb/jail_grpc_web_pb"
import { APIPromiseClient } from "./pb/api_grpc_web_pb"
import { BugsPromiseClient } from "./pb/bugs_grpc_web_pb"
import { SSOPromiseClient } from "./pb/sso_grpc_web_pb"
import { ConversationsPromiseClient } from "./pb/conversations_grpc_web_pb"
import { RequestsPromiseClient } from "./pb/requests_grpc_web_pb"

const opts = { withCredentials: true }

export const client = new APIPromiseClient(URL, null, opts)
export const jailClient = new JailPromiseClient(URL, null, opts)
export const bugsClient = new BugsPromiseClient(URL, null, opts)
export const SSOclient = new SSOPromiseClient(URL, null, opts)
export const conversations = new ConversationsPromiseClient(URL, null, opts)
export const authClient = new AuthPromiseClient(URL, null, opts)
export const requestsClient = new RequestsPromiseClient(URL, null, opts)

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const grpcWebTools = window.__GRPCWEB_DEVTOOLS__ || (() => {})
  grpcWebTools([
    client,
    jailClient,
    bugsClient,
    SSOclient,
    conversations,
    authClient,
    requestsClient,
  ])
}
