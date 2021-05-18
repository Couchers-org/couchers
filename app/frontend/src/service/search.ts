import { StringValue } from "google-protobuf/google/protobuf/wrappers_pb";
import { UserSearchReq } from "pb/search_pb";
import client from "service/client";

export async function userSearch(query: string, pageToken: string = "") {
  const req = new UserSearchReq();
  req.setQuery(new StringValue().setValue(query));
  req.setPageToken(pageToken);

  const response = await client.search.userSearch(req);

  return response.toObject();
}
