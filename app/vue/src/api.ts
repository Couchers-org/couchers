const URL = process.env.VUE_APP_API_URL

import { AuthPromiseClient } from "./pb/auth_grpc_web_pb"
import { JailPromiseClient } from "./pb/jail_grpc_web_pb"
import { APIPromiseClient } from "./pb/api_grpc_web_pb"
import { BugsPromiseClient } from "./pb/bugs_grpc_web_pb"
import { SSOPromiseClient } from "./pb/sso_grpc_web_pb"
import { ConversationsPromiseClient } from "./pb/conversations_grpc_web_pb"
import { RequestsPromiseClient } from "./pb/requests_grpc_web_pb"

import interceptor from "./interceptor"

const opts = {
  unaryInterceptors: [interceptor],
  streamInterceptors: [interceptor],
}

// There seems to be an error in the `opts` parameter's type, so have to ignore that line.

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const client = new APIPromiseClient(URL, null, opts) as APIPromiseClient

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const jailClient = new JailPromiseClient(URL, null, opts) as JailPromiseClient

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const bugsClient = new BugsPromiseClient(URL, null, opts) as BugsPromiseClient

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const SSOclient = new SSOPromiseClient(URL, null, opts) as SSOPromiseClient

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const conversations = new ConversationsPromiseClient(URL, null, opts) as ConversationsPromiseClient

export const authClient = new AuthPromiseClient(URL)

// prettier-ignore
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const requestsClient = new RequestsPromiseClient(URL, null, opts) as RequestsPromiseClient
