import { GetUserByIdReq } from './pb/api_pb'
import { APIClient } from './pb/ApiServiceClientPb'

import auth from './auth'

const opts = {
  unaryInterceptors: [auth.interceptor],
  streamInterceptors: [auth.interceptor]
};

// There seems to be an error in the `opts` parameter's type, so have to ignore that line.
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const client = new APIClient('http://localhost:8888', null, opts)

export async function getUser(id: number) {
  const req = new GetUserByIdReq()
  req.setId(id)
  const res = await client.getUserById(req, null)
  return res.toObject()
}
