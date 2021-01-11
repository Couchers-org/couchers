import { GetGroupReq, ListAdminsReq, ListMembersReq } from "../pb/groups_pb";
import client from "./client";

export async function getGroup(groupId: number) {
  const req = new GetGroupReq();
  req.setGroupId(groupId)
  const response = await client.groups.getGroup(req)
  return response.toObject()
}

export async function listAdmins(groupId: number, pageToken?: string) {
  const req = new ListAdminsReq();
  req.setGroupId(groupId)
  if (pageToken) {
    req.setPageToken(pageToken)
  }
  const response = await client.groups.listAdmins(req)
  return response.toObject()
}

export async function listMembers(groupId: number, pageToken?: string) {
  const req = new ListMembersReq();
  req.setGroupId(groupId)
  if (pageToken) {
    req.setPageToken(pageToken)
  }
  const response = await client.groups.listMembers(req)
  return response.toObject()
}
