import { GetUserByIdRequest } from './pb/api_pb'
import { APIClient } from './pb/ApiServiceClientPb'

const client = new APIClient('http://localhost:8888')

export async function get_user_0() {
    const req = new GetUserByIdRequest()
    req.setId(1)
    const res = await client.getUserById(req, null)
    return res.toObject()
}
