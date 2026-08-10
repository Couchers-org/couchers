import {
  GetCommunityReq,
  JoinCommunityReq,
  LeaveCommunityReq,
  ListAdminsReq,
  ListAllCommunitiesReq,
  ListCommunitiesReq,
  ListDiscussionsReq,
  ListGroupsReq,
  ListGuidesReq,
  ListMembersReq,
  ListNearbyUsersReq,
  ListPlacesReq,
  ListRecentCommunitiesReq,
  ListUserCommunitiesReq,
  SearchCommunitiesReq,
} from "proto/communities_pb";
import { ListMyCommunitiesDiscussionsReq } from "proto/discussions_pb";

import client from "./client";

export async function getCommunity(communityId: number) {
  const req = new GetCommunityReq();
  req.setCommunityId(communityId);
  const response = await client.communities.getCommunity(req);
  return response.toObject();
}

/**
 * List sub-communities of a given community
 */
export async function listCommunities(communityId: number, pageToken?: string) {
  const req = new ListCommunitiesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listCommunities(req);
  return response.toObject();
}

export async function listGroups(communityId: number, pageToken?: string) {
  const req = new ListGroupsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listGroups(req);
  return response.toObject();
}

export async function listAdmins(communityId: number, pageToken?: string) {
  const req = new ListAdminsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  req.setPageSize(6);
  const response = await client.communities.listAdmins(req);
  return response.toObject();
}

export async function listMembers({
  communityId,
  pageSize,
  pageToken,
}: {
  communityId: number;
  pageSize?: number;
  pageToken?: string;
}) {
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
}

export async function listNearbyUsers(communityId: number, pageToken?: string) {
  const req = new ListNearbyUsersReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listNearbyUsers(req);
  return response.toObject();
}

export async function listPlaces(communityId: number, pageToken?: string) {
  const req = new ListPlacesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listPlaces(req);
  return response.toObject();
}

export async function listGuides(communityId: number, pageToken?: string) {
  const req = new ListGuidesReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listGuides(req);
  return response.toObject();
}

export async function listDiscussions(communityId: number, pageToken?: string) {
  const req = new ListDiscussionsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.communities.listDiscussions(req);
  return response.toObject();
}

export async function listMyCommunitiesDiscussions({ pageSize, pageToken }: { pageToken?: string; pageSize?: number }) {
  const req = new ListMyCommunitiesDiscussionsReq();
  if (pageToken) {
    req.setPageToken(pageToken);
  }

  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const response = await client.discussions.listMyCommunitiesDiscussions(req);

  return response.toObject();
}

export async function joinCommunity(communityId: number) {
  const req = new JoinCommunityReq();
  req.setCommunityId(communityId);
  await client.communities.joinCommunity(req);
}

export async function leaveCommunity(communityId: number) {
  const req = new LeaveCommunityReq();
  req.setCommunityId(communityId);
  await client.communities.leaveCommunity(req);
}

export async function listUserCommunities(pageToken?: string, pageSize?: number) {
  const req = new ListUserCommunitiesReq();
  if (pageSize) req.setPageSize(pageSize);
  if (pageToken) req.setPageToken(pageToken);
  return (await client.communities.listUserCommunities(req)).toObject();
}

export async function searchCommunities(query: string, pageSize?: number) {
  const req = new SearchCommunitiesReq();
  req.setQuery(query);
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const response = await client.communities.searchCommunities(req);
  return response.toObject();
}

export async function listAllCommunities() {
  const req = new ListAllCommunitiesReq();
  const response = await client.communities.listAllCommunities(req);
  return response.toObject();
}

export async function listRecentCommunities(pageSize?: number) {
  const req = new ListRecentCommunitiesReq();
  if (pageSize) {
    req.setPageSize(pageSize);
  }
  const response = await client.communities.listRecentCommunities(req);
  return response.toObject();
}
