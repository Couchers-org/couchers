import { SearchReq, User } from "../pb/api_pb";
import client from "./client";

/**
 * Perform a search and return a list of users.
 *
 * @param {string} query
 * @returns {Promise<User.AsObject[]>}
 */
export async function search(query: string): Promise<User.AsObject[]> {
  const req = new SearchReq();
  req.setQuery(query);

  const response = await client.api.search(req);
  const users = response.getUsersList();

  return users.map((user) => user.toObject());
}
