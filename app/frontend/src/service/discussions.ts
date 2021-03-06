import { CreateDiscussionReq, GetDiscussionReq } from "pb/discussions_pb";
import client from "service/client";

export async function createDiscussion(
  title: string,
  content: string,
  ownerCommunityId?: number,
  ownerGroupId?: number
) {
  const req = new CreateDiscussionReq();
  req.setTitle(title);
  req.setContent(content);
  if (ownerCommunityId) {
    req.setOwnerCommunityId(ownerCommunityId);
  }
  if (ownerGroupId) {
    req.setOwnerGroupId(ownerGroupId);
  }

  const response = await client.discussions.createDiscussion(req);

  return response.toObject();
}

export async function getDiscussion(pageId: number) {
  const req = new GetDiscussionReq();
  req.setDiscussionId(pageId);
  const response = await client.discussions.getDiscussion(req);
  return response.toObject();
}
