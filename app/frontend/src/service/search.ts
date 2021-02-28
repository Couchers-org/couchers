import { User } from "../pb/api_pb";
import { SearchReq } from "../pb/search_pb";
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
  req.setIncludeUsers(true);

  const response = await client.search.search(req);
  const users = response
    .getResultsList()
    .filter((res) => res.hasUser())
    .map((res) => res.getUser());

  return users.map((user) => user!.toObject());
}
