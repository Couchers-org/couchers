import {
  CreateDiscussionReq,
  DeleteDiscussionReq,
  GetDiscussionReq,
  UpdateDiscussionReq,
} from "couchers/proto/discussions_pb";
import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";

import client from "./client";

export async function createDiscussion(
  title: string,
  content: string,
  ownerCommunityId?: number,
  ownerGroupId?: number,
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

export async function getDiscussion(discussionId: number) {
  const req = new GetDiscussionReq();
  req.setDiscussionId(discussionId);
  const response = await client.discussions.getDiscussion(req);
  return response.toObject();
}

export async function updateDiscussion(
  discussionId: number,
  title?: string,
  content?: string,
) {
  const req = new UpdateDiscussionReq();
  req.setDiscussionId(discussionId);
  if (title !== undefined) {
    req.setTitle(new StringValue().setValue(title));
  }
  if (content !== undefined) {
    req.setContent(new StringValue().setValue(content));
  }
  const response = await client.discussions.updateDiscussion(req);
  return response.toObject();
}

export async function deleteDiscussion(discussionId: number) {
  const req = new DeleteDiscussionReq();
  req.setDiscussionId(discussionId);
  await client.discussions.deleteDiscussion(req);
}
