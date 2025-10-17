import {
  GetGroupReq,
  JoinGroupReq,
  LeaveGroupReq,
  ListAdminsReq,
  ListDiscussionsReq,
  ListGuidesReq,
  ListMembersReq,
  ListPlacesReq,
} from "@couchers/services/groups";

import client from "./client";

export const getGroup = async (groupId: number) => {
  const req = new GetGroupReq();
  req.setGroupId(groupId);
  const response = await client.groups.getGroup(req);
  return response.toObject();
};

export const listAdmins = async (groupId: number, pageToken?: string) => {
  const req = new ListAdminsReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listAdmins(req);
  return response.toObject();
};

export const listMembers = async (groupId: number, pageToken?: string) => {
  const req = new ListMembersReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listMembers(req);
  return response.toObject();
};

export const listPlaces = async (groupId: number, pageToken?: string) => {
  const req = new ListPlacesReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listPlaces(req);
  return response.toObject();
};

export const listGuides = async (groupId: number, pageToken?: string) => {
  const req = new ListGuidesReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listGuides(req);
  return response.toObject();
};

export const listDiscussions = async (groupId: number, pageToken?: string) => {
  const req = new ListDiscussionsReq();
  req.setGroupId(groupId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.groups.listDiscussions(req);
  return response.toObject();
};

export const joinGroup = async (groupId: number) => {
  const req = new JoinGroupReq();
  req.setGroupId(groupId);
  await client.groups.joinGroup(req);
};

export const leaveGroup = async (groupId: number) => {
  const req = new LeaveGroupReq();
  req.setGroupId(groupId);
  await client.groups.leaveGroup(req);
};
