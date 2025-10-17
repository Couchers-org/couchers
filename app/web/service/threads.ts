import { GetThreadReq, PostReplyReq } from "@couchers/services/threads";

import client from "./client";

export const getThread = async (threadId: number, pageToken?: string) => {
  const req = new GetThreadReq();
  req.setThreadId(threadId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.threads.getThread(req);
  return response.toObject();
};

export const postReply = async (threadId: number, content: string) => {
  const req = new PostReplyReq();
  req.setThreadId(threadId);
  req.setContent(content);
  const response = await client.threads.postReply(req);
  return response.toObject();
};
