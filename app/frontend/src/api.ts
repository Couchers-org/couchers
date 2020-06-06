import { GetUserByIdRequest } from './pb/api_pb'
import { APIClient } from './pb/ApiServiceClientPb'

const client = new APIClient('http://localhost:8888')

export async function getUser(id: number) {
    const req = new GetUserByIdRequest()
    req.setId(id)
    const res = await client.getUserById(req, null)
    return res.toObject()
}
