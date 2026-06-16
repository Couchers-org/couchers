import {
  DeleteReplyReq,
  GetThreadReq,
  PostReplyReq,
  UpdateReplyReq,
} from "proto/threads_pb";

import client from "./client";

export async function getThread(threadId: number, pageToken?: string) {
  const req = new GetThreadReq();
  req.setThreadId(threadId);
  if (pageToken) {
    req.setPageToken(pageToken);
  }
  const response = await client.threads.getThread(req);
  return response.toObject();
}

export async function postReply(threadId: number, content: string) {
  const req = new PostReplyReq();
  req.setThreadId(threadId);
  req.setContent(content);
  const response = await client.threads.postReply(req);
  return response.toObject();
}

export async function updateReply(threadId: number, content: string) {
  const req = new UpdateReplyReq();
  req.setThreadId(threadId);
  req.setContent(content);
  const response = await client.threads.updateReply(req);
  return response.toObject();
}

export async function deleteReply(threadId: number) {
  const req = new DeleteReplyReq();
  req.setThreadId(threadId);
  await client.threads.deleteReply(req);
}
