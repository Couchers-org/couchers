import { GetThreadReq, PostReplyReq } from "pb/threads_pb";
import client from "service/client";

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
