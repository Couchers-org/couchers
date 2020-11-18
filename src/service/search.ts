import client from "../features/api";
import { SearchReq, User } from "../pb/api_pb";

/**
 * Perform a search and return a list of users.
 *
 * @param {string} query
 * @returns {Promise<User.AsObject[]>}
 */
export const search = async (query: string): Promise<User.AsObject[]> => {
  const req = new SearchReq();
  req.setQuery(query);

  const response = await client.api.search(req);
  const users = response.getUsersList();

  return users.map((user) => user.toObject());
};
