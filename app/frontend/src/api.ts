import { AuthClient } from './pb/AuthServiceClientPb'
import { APIClient } from './pb/ApiServiceClientPb'

import interceptor from './interceptor'

const opts = {
  unaryInterceptors: [interceptor],
  streamInterceptors: [interceptor]
};

// There seems to be an error in the `opts` parameter's type, so have to ignore that line.
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
export const client = new APIClient('http://localhost:8888', null, opts)

export const authClient = new AuthClient("http://127.0.0.1:8888")
