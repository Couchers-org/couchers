import { GetCommunityReq } from "../pb/communities_pb";
import client from "./client";

export async function getCommunity(communityId: number) {
  const req = new GetCommunityReq();
  req.setCommunityId(communityId)
  const response = await client.communities.getCommunity(req)
  return response.toObject()
}
