import { ListEventsReq } from "proto/communities_pb";
import client from "service/client";

export async function listCommunityEvents(
  communityId: number,
  pageToken?: string,
  pageSize?: number
) {
  const req = new ListEventsReq();
  req.setCommunityId(communityId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  if (pageSize) {
    req.setPageSize(pageSize);
  }

  const res = await client.communities.listEvents(req);
  return res.toObject();
}
