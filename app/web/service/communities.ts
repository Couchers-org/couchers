import {
  GetCommunityReq,
  JoinCommunityReq,
  LeaveCommunityReq,
  ListAdminsReq,
  ListCommunitiesReq,
  ListDiscussionsReq,
  ListGroupsReq,
  ListGuidesReq,
  ListMembersReq,
  ListNearbyUsersReq,
  ListPlacesReq,
  ListUserCommunitiesReq,
} from "@couchers/services/communities";

import client from "./client";

export const getCommunity = async (communityId: number) => {
  const req = new GetCommunityReq();
  req.setCommunityId(communityId);
  const response = await client.communities.getCommunity(req);
  return response.toObject();
};

/**
 * List sub-communities of a given community
 */
export const listCommunities = async (
  communityId: number,
  pageToken?: string,
) => {
  const req = new ListCommunitiesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listCommunities(req);
  return response.toObject();
};

export const listGroups = async (communityId: number, pageToken?: string) => {
  const req = new ListGroupsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listGroups(req);
  return response.toObject();
};

export const listAdmins = async (communityId: number, pageToken?: string) => {
  const req = new ListAdminsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  req.setPageSize(6);
  const response = await client.communities.listAdmins(req);
  return response.toObject();
};

export const listMembers = async ({
  communityId,
  pageSize,
  pageToken,
}: {
  communityId: number;
  pageSize?: number;
  pageToken?: string;
}) => {
  const req = new ListMembersReq();
  req.setCommunityId(communityId);

  if (pageSize) {
    req.setPageSize(pageSize);
  }

  if (pageToken) {
    req.setPageToken(pageToken);
  }

  const response = await client.communities.listMembers(req);

  return response.toObject();
};

export const listNearbyUsers = async (
  communityId: number,
  pageToken?: string,
) => {
  const req = new ListNearbyUsersReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listNearbyUsers(req);
  return response.toObject();
};

export const listPlaces = async (communityId: number, pageToken?: string) => {
  const req = new ListPlacesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listPlaces(req);
  return response.toObject();
};

export const listGuides = async (communityId: number, pageToken?: string) => {
  const req = new ListGuidesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listGuides(req);
  return response.toObject();
};

export const listDiscussions = async (
  communityId: number,
  pageToken?: string,
) => {
  const req = new ListDiscussionsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listDiscussions(req);
  return response.toObject();
};

export const joinCommunity = async (communityId: number) => {
  const req = new JoinCommunityReq();
  req.setCommunityId(communityId);
  await client.communities.joinCommunity(req);
};

export const leaveCommunity = async (communityId: number) => {
  const req = new LeaveCommunityReq();
  req.setCommunityId(communityId);
  await client.communities.leaveCommunity(req);
};

export const listUserCommunities = async (pageToken?: string) => {
  const req = new ListUserCommunitiesReq();
  if (pageToken) req.setPageToken(pageToken);
  return (await client.communities.listUserCommunities(req)).toObject();
};
