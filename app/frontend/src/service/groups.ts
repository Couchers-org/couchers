import { GetGroupReq } from "../pb/groups_pb";
import client from "./client";

export async function getGroup(groupId: number) {
  const req = new GetGroupReq();
  req.setGroupId(groupId)
  const response = await client.groups.getGroup(req)
  return response.toObject()
}
