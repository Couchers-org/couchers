import { GetThreadReq, PostReplyReq } from "../pb/threads_pb";
import client from "./client";

export async function getThread(threadId: number) {
  const req = new GetThreadReq();
  req.setThreadId(threadId);
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
