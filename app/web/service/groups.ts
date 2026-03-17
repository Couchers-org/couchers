import {
  GetGroupReq,
  JoinGroupReq,
  LeaveGroupReq,
  ListAdminsReq,
  ListDiscussionsReq,
  ListGuidesReq,
  ListMembersReq,
  ListPlacesReq,
} from "proto/groups_pb";

import client from "./client";

export async function getGroup(groupId: string) {
  const req = new GetGroupReq();
  req.setGroupId(groupId);
  const response = await client.groups.getGroup(req);
  return response.toObject();
}

export async function listAdmins(groupId: string, pageToken?: string) {
  const req = new ListAdminsReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listAdmins(req);
  return response.toObject();
}

export async function listMembers(groupId: string, pageToken?: string) {
  const req = new ListMembersReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listMembers(req);
  return response.toObject();
}

export async function listPlaces(groupId: string, pageToken?: string) {
  const req = new ListPlacesReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listPlaces(req);
  return response.toObject();
}

export async function listGuides(groupId: string, pageToken?: string) {
  const req = new ListGuidesReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listGuides(req);
  return response.toObject();
}

export async function listDiscussions(groupId: string, pageToken?: string) {
  const req = new ListDiscussionsReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listDiscussions(req);
  return response.toObject();
}

export async function joinGroup(groupId: string) {
  const req = new JoinGroupReq();
  req.setGroupId(groupId);
  await client.groups.joinGroup(req);
}

export async function leaveGroup(groupId: string) {
  const req = new LeaveGroupReq();
  req.setGroupId(groupId);
  await client.groups.leaveGroup(req);
}
