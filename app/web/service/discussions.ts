import {
  CreateDiscussionReq,
  GetDiscussionReq,
} from "@couchers/services/discussions";

import client from "./client";

export const createDiscussion = async (
  title: string,
  content: string,
  ownerCommunityId?: number,
  ownerGroupId?: number,
) => {
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
};

export const getDiscussion = async (discussionId: number) => {
  const req = new GetDiscussionReq();
  req.setDiscussionId(discussionId);
  const response = await client.discussions.getDiscussion(req);
  return response.toObject();
};
